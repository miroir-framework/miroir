import { rest } from 'msw'
import { IndexedDb } from '../../4_services/localStore/indexedDb';

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100

const serializePost = (post:any) => ({
  ...post,
  user: post.user.id,
})


export class IndexedDbObjectStore {
  public localIndexedStorage = new IndexedDb('miroir');

  constructor(private rootApiUrl:string) {

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
      this.rootApiUrl+'/'+'Entity/all', 
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
      this.rootApiUrl+'/'+'Report/all', 
      async (req, res, ctx) => {
        const localData = await this.localIndexedStorage.getAllValue('Report');
        return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(
          localData
        ))
      }
    ),
  ]
  

}
