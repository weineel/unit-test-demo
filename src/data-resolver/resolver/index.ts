import { I_Loader, I_LoadHooks, T_LoaderKey, I_Transform } from '../types'
import { compact, get, isArray, isNumber, isString, map, every, pick } from 'lodash'

/**
 * Resolver，是 Loader 和 Transform 的统称。
 * 由于待恢复数据有数组的存在，所以一个 Resolve 可能对应多个 ResolveWorker。
 * @implements I_Loader, I_Transform 要同时实现两个接口，这边有点耦合，目的是方便 register 的实现。
 */
export class Resolver implements I_Loader, I_Transform {
  hooks?: I_LoadHooks

  /**
   * 默认行为：格式化待恢复的 key。子类重写，可以定制逻辑
   * @implements I_Loader
   */
  public formatLoadKey(value: T_LoaderKey): T_LoaderKey {
    return value
  }

  /**
   * 默认行为： 判断值是否可以进行 恢复，必须是 字符串或数字或则两者的数组。
   * @implements I_Loader
   */
  valueIsCanLoad(value: any): boolean {
    const v = [].concat(value)
    return every(v, (e) => (isString(e) && e) || isNumber(e))
  }

  /**
   * 默认行为：直接返回，不恢复。
   * @implements I_Loader
   */
  async loadMany(loadKeys: any[], parentValue: any): Promise<any[]> {
    return loadKeys || []
  }

  /**
   * @implements I_Transform
   */
  transform(value: any, key: any, parentValue: any): any {
    const valueId = 'sid'
    if (isArray(value)) {
      return compact(map(value, (v) => v[valueId] ?? v)) || null
    } else {
      return +get(value, valueId, value) || null
    }
  }

  private formatPick(v: any, keys: string[], idKey: string) {
    const value = pick(v, keys)
    value.id = v[idKey]
    return value
  }

  protected pick(value: any, keys: string[], idKey = 'sid') {
    if (isArray(value)) {
      return map(value, v => this.formatPick(v, keys, idKey))
    } else {
      return this.formatPick(value, keys, idKey)
    }
  }

  constructor(hooks?: I_LoadHooks) {
    this.hooks = hooks
  }
}
