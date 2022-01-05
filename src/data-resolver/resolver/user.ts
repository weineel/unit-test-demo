import { Resolver } from '.'
import { getUsersByIds } from '../../services/user'
import { createDataLoader } from '../utils'

const loader = createDataLoader(keys => getUsersByIds(keys))

export class UserResolver extends Resolver {
  loadMany(loadKeys: any[]) {
    return loader.loadMany(loadKeys)
  }
}
