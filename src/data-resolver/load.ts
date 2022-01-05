import { I_LoadHooks, T_LoaderKey, I_Loader } from './types'
import { clone, first, forEach, get, isArray, isFunction, isNil, set } from 'lodash'
import { isLoader, joinKeyPath } from './utils'

export type T_LoadSchema<T = any> = {
  [key in keyof T]?:
    | I_Loader | T_LoadSchema<T[key] extends Array<any> ? T[key][number] : T[key]>
    | ((parentValue: T, keyPath: string[]) => null | undefined | I_Loader | T_LoadSchema<T[key] extends Array<any> ? T[key][number] : T[key]>)
}

interface I_LoadWorkerBuilderParams {
  // 待恢复的原始值
  value: T_LoaderKey
  // value 所在对象
  parentValue: any
  // loadSchema 配置的 loader，可能对应多个 LoadWorker（待恢复数据是数组的情况）
  loader: I_Loader
  // 原始的 keyPath
  keyPath: string[]
}

const DefaultHooks: Required<I_LoadHooks> = {
  renameKey(key: string, keyPath: string[]) {
    return key
  },

  renameKeyPath(keyPath: string[]) {
    return keyPath
  },

  formatLoadedValue(loadedValue: any | any[]) {
    return loadedValue
  },
}

class LoadWorker {
  // 待恢复的原始值，数字或字符串，或两者的数组
  value!: T_LoaderKey

  // value 所在对象
  parentValue!: any

  // 待恢复数据的唯一标识
  loadKey!: T_LoaderKey

  // 最终要赋值的 keyPath
  keyPathStr!: string

  // 原始 keyPath
  originKeyPath!: string[]

  // 格式化后的已恢复数据
  loadedValue: any

  loader!: I_Loader

  // 最终使用的 hooks
  hooks!: Required<I_LoadHooks>

  /**
   * 如果恢复的是数组，只返回能恢复成功的数据，如果都恢复失败，则返回 undefined。
   * 如果恢复的是单个数据，恢复成功，返回恢复的数据，否则返回 undefined。
   * */
  async doWork() {
    let originLoadedValue
    try {
      originLoadedValue = await this.loader.loadMany(([] as T_LoaderKey[]).concat(this.loadKey), this.parentValue)
      const errors: Error[] = []
      originLoadedValue = originLoadedValue.filter(e => e instanceof Error ? (errors.push(e), false) : true)
      if (originLoadedValue.length) {
        if (isArray(this.loadKey)) {
          this.loadedValue = originLoadedValue.map(e => this.hooks.formatLoadedValue(e, this.originKeyPath))
        } else {
          this.loadedValue = this.hooks.formatLoadedValue(first(originLoadedValue), this.originKeyPath)
        }
      }
      // 不管是否可以返回部分数据，都要把 error log 出来。
      if (errors.length) {
        throw errors
      }
    } catch (ex) {
      // CR: 恢复失败不返回原始数据。
      // this.loadedValue = this.value
      // loadWorkerDebug('originKeyPath: [%s], 数据恢复失败, error: [%o]', joinKeyPath(this.originKeyPath), ex)
      console.error(ex)
    }
    return this.loadedValue
  }

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    // 私有化构造函数，只能使用 builder 函数进行构造。
  }

  static builder(params: I_LoadWorkerBuilderParams): LoadWorker | null {
    const loadWorker = new LoadWorker()
    loadWorker.loader = params.loader
    const hooks = {
      ...DefaultHooks,
      ...params.loader.hooks,
    }
    loadWorker.hooks = hooks

    loadWorker.originKeyPath = params.keyPath
    const keyPath = clone(params.keyPath)
    const key = keyPath.pop()
    if (key) {
      keyPath.push(isFunction(hooks.renameKey) ? hooks.renameKey(key, keyPath.concat(key)) : hooks.renameKey)
    } else {
      // loadWorkerBuilderDebug('[%s] 不是合法的 key', key)
      return null
    }

    const keyPathStr = joinKeyPath(hooks.renameKeyPath(keyPath))
    // TODO: 校验 keyPath
    if (keyPathStr) {
      loadWorker.keyPathStr = keyPathStr
    } else {
      // loadWorkerBuilderDebug('[%s] 不是合法的 keyPath', keyPathStr)
      return null
    }

    const value = params.value
    if (params.loader.valueIsCanLoad(value)) {
      loadWorker.value = value
      loadWorker.parentValue = params.parentValue
    } else {
      // loadWorkerBuilderDebug('待恢复数据 [%s] 的值必须是数字或字符串，或两者的数组', keyPathStr)
      return null
    }
    loadWorker.loadKey = params.loader.formatLoadKey(value)
    return loadWorker
  }
}

function genLoadWorkers(payload: any | any, innerValue: any | any[], loadSchema: T_LoadSchema | I_Loader | ((payload: any, keyPath: string[]) => T_LoadSchema | I_Loader), keyPath: string[]): LoadWorker[] {
  const _loadWorkers: LoadWorker[] = []
  const parentKeyPath = joinKeyPath(keyPath.slice(0, -1))
  const parentValue = parentKeyPath ? get(payload, parentKeyPath) : payload
  loadSchema = isFunction(loadSchema) ? loadSchema(parentValue, keyPath) : loadSchema
  if (isLoader(loadSchema)) {
    const loadWorker = LoadWorker.builder({
      parentValue,
      value: innerValue,
      loader: loadSchema,
      keyPath,
    })
    if (loadWorker) {
      _loadWorkers.push(loadWorker)
    }
  } else if (loadSchema) {
    if (isArray(innerValue)) {
      innerValue.forEach((d, index) => {
        _loadWorkers.push(...genLoadWorkers(payload, d, loadSchema, keyPath.concat([String(index)])))
      })
    } else {
      forEach(loadSchema, (dataLoaderSchema, key) => {
        const value = get(innerValue, key)
        _loadWorkers.push(...genLoadWorkers(payload, value, dataLoaderSchema as T_LoadSchema, keyPath.concat([key])))
      })
    }
  }
  return _loadWorkers
}

/**
 * 数据恢复，手写配置
 * @param data 待恢复数据，可以是数组
 * @param {T_LoadSchema} loadSchema 恢复配置
 */
export async function load<T extends Record<string, any> = any>(payload: T, loadSchema: T_LoadSchema<T>): Promise<T>;
export async function load<T extends Record<string, any> = any>(payload: T[], loadSchema: T_LoadSchema<T>): Promise<T[]>;
export async function load<T extends Record<string, any> = any>(payload: T | T[], loadSchema: T_LoadSchema<T>): Promise< T | T[]> {
  const loadWorkers: LoadWorker[] = genLoadWorkers(payload, payload, loadSchema, [])
  // 恢复
  await Promise.all(loadWorkers.map(w => w.doWork()))
  loadWorkers.forEach(e => {
    set(payload, e.keyPathStr, e.loadedValue)
  })
  return payload
}

/**
 * 恢复原始类型，不限制待恢复数据为对象会对象数组。
 */
export async function loadPrimitive<R extends Record<string, any> = any, D extends string | number = number>(data: D, loader: I_Loader): Promise<R>;
export async function loadPrimitive<R extends Record<string, any> = any, D extends string | number = number>(data: D[], loader: I_Loader): Promise<R[]>;
export async function loadPrimitive<R extends Record<string, any> = any, D extends string | number = number>(data: D[] | D, loader: I_Loader): Promise<R[] | R> {
  const dataIsArray = isArray(data)
  const resolvedObj = await load({
    value: data,
  }, {
    value: loader,
  })
  const value = resolvedObj.value
  return dataIsArray ? (value as any[] || []) : value as any
}
