import { rest } from 'msw'
import IndexedDb from '../miroir-fwk/domain/indexedDb'
import miroirConfig from '../miroir-fwk/assets/miroirConfig.json'

console.log("server.ts miroirConfig", miroirConfig);

const NUM_USERS = 3
const POSTS_PER_USER = 3
const RECENT_NOTIFICATIONS_DAYS = 7

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100

const serializePost = (post:any) => ({
  ...post,
  user: post.user.id,
})


export class MServer {
  public localIndexedStorage = new IndexedDb('miroir');

  constructor() {

  }

  public async createObjectStore(tableNames:string[]) {
    return this.localIndexedStorage.createObjectStore(tableNames);
  }

  public async closeObjectStore() {
    return this.localIndexedStorage.closeObjectStore();
  }

  public async openObjectStore() {
    return this.localIndexedStorage.openObjectStore();
  }

  public handlers:any[] = [
    rest.get(
      // '/fakeApi/Entity/all', 
      miroirConfig.rootApiUrl+'/'+'Entity/all', 
      async (req, res, ctx) => {
        console.log('Entity/all started');

        const localData = await this.localIndexedStorage.getAllValue('Entity');
        console.log('server Entity/all', localData);
        return res(
          ctx.json(
            localData
          )
        );
      }
    ),
    rest.get(
      miroirConfig.rootApiUrl+'/'+'Report/all', 
      async (req, res, ctx) => {
        const localData = await this.localIndexedStorage.getAllValue('Report');
        return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(
          localData
        ))
      }
    ),
  ]
  

}
