import { rest } from 'msw'
import IndexedDb from 'src/miroir-fwk/4_services/localStore/indexedDb'
import miroirConfig from 'src/miroir-fwk/assets/miroirConfig.json'

console.log("server.ts miroirConfig", miroirConfig);

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100

const serializePost = (post:any) => ({
  ...post,
  user: post.user.id,
})


export class MDevServer {
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
