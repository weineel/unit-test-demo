import { find, join, isFunction } from 'lodash'
import { I_Loader, I_Transform } from './types'
import Dataloader from 'dataloader'

export function createDataLoader<T>(fetcher: (keys: number[]) => Promise<T[]>): Dataloader<string | number, T> {
  return new Dataloader(
    async (keys: any) => {
      const rt = await fetcher(keys)
      return alignResponseByKeys(rt, keys)
    },
    {
      cache: true,
    }
  )
}

/**
 * response 对齐到 keys。
 * @param response resolve 的结果
 * @param keys 用于 resolve 的 key 数组
 */
export function alignResponseByKeys(response: any[], keys: number[]): any[] {
  return keys.map(id => {
    // eslint-disable-next-line eqeqeq
    const matched = find(response, (e) => e.id == id)
    return matched || new Error(`DataResolve: No result for ${id}`)
  })
}

/**
 * 用 . 链接所有 key
 * @param keyPath keyPath
 */
export function joinKeyPath(keyPath: string[]) {
  return join(keyPath, '.')
}

/**
 * 判断是否实现了 I_Loader 接口
 */
export function isLoader(obj: any): obj is I_Loader {
  return isFunction(obj?.loadMany) && isFunction(obj?.formatLoadKey)
}

/**
 * 判断是否需实现了 I_Transform 接口
 */
export function isTransform(obj: any): obj is I_Transform {
  return isFunction(obj?.transform)
}
