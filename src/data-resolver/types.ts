export type T_LoaderKey = any | any[]

export interface I_LoadHooks {
  renameKey?: string | ((key: string, keyPath: string[]) => string)
  renameKeyPath?: ((keyPath: string[]) => string[])
  // loadedValue 为单个值，即使 loadKey 是数组的情况。
  formatLoadedValue?: (loadedValue: any, originKeyPath: string[]) => any
}

// key 是 sid，值是恢复好的数据
export type DisplayLabels = Record<string, any>

/**
 * 数据加载器，sid 恢复成对象
 */
export interface I_Loader {
  hooks?: I_LoadHooks

  // 格式化待恢复的 key。子类重写，可以定制逻辑
  formatLoadKey(value: T_LoaderKey): T_LoaderKey

  // 校验 value 是否可以被 load
  valueIsCanLoad(value: T_LoaderKey): boolean

  // 加载数据。谨慎修改函数名，isLoader 函数依赖这个名字。
  loadMany(loadKeys: any[], parentValue: any): Promise<any[]>
}

/**
 * 数据转换，是 Loader 的逆向操作，对象转换成后端接口要用的数据。
 */
export interface I_Transform {
  /**
   * 对象转换成后端接口要用的数据。
   * @param value 恢复后的数据
   * @param key value 在 parentValue 中的属性名
   * @param parentValue value 所在的对象，这个对象是原始数据的引用，transform 函数对其操作会有副作用(在某些场景副作用是有意义的)。
   * @returns 转换结果, 没有取到期望值时，直接返回原始值
   */
  transform(value: any, key: any, parentValue: any): any
}

export type F_LoadMany = (keys: number[] | string[]) => any[]
