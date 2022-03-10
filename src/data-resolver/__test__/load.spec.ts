import { get, map } from 'lodash'
import { load, UserResolver } from '../'
import { User } from '../../services/user'
import { loadPrimitive } from '../load'

jest.mock('../../services/user', () => {
  const originalModule = jest.requireActual('../../services/user');

  //Mock the default export and named export 'foo'
  return {
    __esModule: true,
    ...originalModule,
    // default: jest.fn(() => 'mocked baz'),
    getUsersByIds: jest.fn(async () => {
      return [{
        id: 44,
        name: 'weineel-44',
      }, {
        id: 55,
        name: 'weineel-55',
      }, {
        id: 66,
        name: 'weineel-66',
      }, {
        id: 77,
        name: 'weineel-77',
      }]
    }),
  };
})

afterAll(() => {
  // 删除测试过程中产生的文件等
})

describe('load', () => {
  it('Simple use', async () => {
    const res = await load({
      id: 44,
      sss: '999',
    }, {
      id: new UserResolver()
    })
    expect(get(res, 'id.name')).toEqual('weineel-44')
  })

  it('Nested use', async () => {
    const res = await load({
      user_id: 44,
      obj: [{
        user_id: 55,
      }, {
        user_id: 66,
      }],
      uuu: {
        ddd: {
          user_id: 77,
          user_ids: [44, 55, 66],
        },
      },
    }, {
      user_id: new UserResolver({ renameKey: 'user_name', formatLoadedValue: (v: User) => v.name }),
      obj: {
        user_id: new UserResolver(),
      },
      uuu: {
        ddd: {
          user_id: new UserResolver(),
          user_ids: new UserResolver(),
        },
      },
    })
    expect(get(res, 'user_name')).toEqual('weineel-44')
    expect(get(res, 'obj.0.user_id.name')).toEqual('weineel-55')
    expect(get(res, 'obj.1.user_id.name')).toEqual('weineel-66')
    expect(get(res, 'uuu.ddd.user_id.name')).toEqual('weineel-77')
    expect(get(res, 'uuu.ddd.user_ids').map((e: User) => e.name)).toEqual(['weineel-44', 'weineel-55', 'weineel-66'])
  })

  it('Except case', async () => {
    const res = await load({
      user_id: 999,
    }, {
      user_id: new UserResolver()
    })
    expect(get(res, 'user_id.name')).toBeUndefined()
  })
})

describe('loadPrimitive', () => {
  it('Load single id', async () => {
    const res = await loadPrimitive(44, new UserResolver())
    expect(get(res, 'name')).toEqual('weineel-44')
  })

  it('Load array', async () => {
    const res = await loadPrimitive([44, 55, 66], new UserResolver())
    expect(map(res, e => e.name)).toEqual(['weineel-44', 'weineel-55', 'weineel-66'])
  })

  it('Load single id except', async () => {
    const res = await loadPrimitive(777, new UserResolver())
    expect(get(res, 'name')).toBeUndefined()
  })

  it('Load array except', async () => {
    // 只能加载前两个
    const res = await loadPrimitive([44, 55, 99], new UserResolver())
    expect(map(res, e => e.name)).toEqual(['weineel-44', 'weineel-55'])
  })

  it('Load empty array', async () => {
    // 只能加载前两个
    const res = await loadPrimitive([], new UserResolver())
    expect(res).toEqual([])
  })
})
