import { rest } from 'msw'
import IndexedDb from '../../src/miroir-fwk/state/indexedDb'
import reportEntityList from "C:/Users/nono/Documents/devhome/miroir-app/miroir-standalone-app/src/miroir-fwk/assets/reports/entityList.json"
import miroirConfig from "../miroir-fwk/assets/miroirConfig.json"


const NUM_USERS = 3
const POSTS_PER_USER = 3
const RECENT_NOTIFICATIONS_DAYS = 7

// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 100

// Set up a seeded random number generator, so that we get
// a consistent set of users / entries each time the page loads.
// This can be reset by deleting this localStorage value,
// or turned off by setting `useSeededRNG` to false.
// let useSeededRNG = true

// let rng = seedrandom()

// if (useSeededRNG) {
//   let randomSeedString = localStorage.getItem('randomTimestampSeed')
//   let seedDate

//   if (randomSeedString) {
//     seedDate = new Date(randomSeedString)
//   } else {
//     seedDate = new Date()
//     randomSeedString = seedDate.toISOString()
//     localStorage.setItem('randomTimestampSeed', randomSeedString)
//   }

//   rng = seedrandom(randomSeedString)
//   setRandom(rng)
//   faker.seed(seedDate.getTime())
// }

// function getRandomInt(min, max) {
//   min = Math.ceil(min)
//   max = Math.floor(max)
//   return Math.floor(rng() * (max - min + 1)) + min
// }

// const randomFromArray = (array) => {
//   const index = getRandomInt(0, array.length - 1)
//   return array[index]
// }

/* MSW Data Model Setup */

// export const db = factory({
//   user: {
//     id: primaryKey(nanoid),
//     firstName: String,
//     lastName: String,
//     name: String,
//     username: String,
//     // posts: manyOf('post'),
//   },
//   // post: {
//   //   id: primaryKey(nanoid),
//   //   title: String,
//   //   date: String,
//   //   content: String,
//   //   reactions: oneOf('reaction'),
//   //   comments: manyOf('comment'),
//   //   user: oneOf('user'),
//   // },
//   // comment: {
//   //   id: primaryKey(String),
//   //   date: String,
//   //   text: String,
//   //   post: oneOf('post'),
//   // },
//   // reaction: {
//   //   id: primaryKey(nanoid),
//   //   thumbsUp: Number,
//   //   hooray: Number,
//   //   heart: Number,
//   //   rocket: Number,
//   //   eyes: Number,
//   //   post: oneOf('post'),
//   // },
// })
// const createUserData = () => {
//   const firstName = faker.name.firstName()
//   const lastName = faker.name.lastName()
//   return {
//     firstName,
//     lastName,
//     name: `${firstName} ${lastName}`,
//     username: faker.internet.userName(),
//   }
// }
// const createPostData = (user) => {
//   return {
//     title: faker.lorem.words(),
//     date: faker.date.recent(RECENT_NOTIFICATIONS_DAYS).toISOString(),
//     user,
//     content: faker.lorem.paragraphs(),
//     reactions: db.reaction.create(),
//   }
// }
// Create an initial set of users and posts
// for (let i = 0; i < NUM_USERS; i++) {
//   const author = db.user.create(createUserData())
//   // for (let j = 0; j < POSTS_PER_USER; j++) {
//   //   const newPost = createPostData(author)
//   //   db.post.create(newPost)
//   // }
// }

const serializePost = (post:any) => ({
  ...post,
  user: post.user.id,
})


// await this.localIndexedStorage.createObjectStore(["Entity","Instance"]);
// await this.localIndexedStorage.putValue("Entity",entityReport);
// await this.localIndexedStorage.putValue("Entity",entityEntity);
// await this.localIndexedStorage.closeObjectStore();

export class MServer {
  public localIndexedStorage = new IndexedDb('miroir');

  constructor() {

  }

  public async createObjectStore(tableNames:string[]) {
    return this.localIndexedStorage.createObjectStore(tableNames);
  }

  public async closeObjectStore() {
    return this.localIndexedStorage.closeObjectStore;
  }

  public handlers:any[] = [
    rest.get(
      // '/fakeApi/Entity/all', 
      miroirConfig.rootApiUrl+'/'+'Entity/all', 
      async (req, res, ctx) => {

      const localData = await this.localIndexedStorage.getAllValue('Entity');
      // console.log('server /fakeApi/Entity/all return',localData)
      return res(
          // ctx.delay(ARTIFICIAL_DELAY_MS), 
          ctx.json(
            localData
          )
        );
      }
    ),
    rest.get(
      // '/fakeApi/Report/all', 
      miroirConfig.rootApiUrl+'/'+'Report/all', 
      async (req, res, ctx) => {
        // return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(db.user.getAll()))
        // const localData = [
        //   await this.localIndexedStorage.getValue('Entity',entityReport.uuid),
        //   await this.localIndexedStorage.getValue('Entity',entityEntity.uuid),
        // ]
        const localData = await this.localIndexedStorage.getAllValue('Report');
        return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(
          // [reportEntityList]
          localData
        ))
      }
    ),
  ]
  

}


// localIndexedStorage.getValue('Entity',entityReport.uuid)
/* MSW REST API Handlers */

// export const server:any = setupServer(...handlers);
// export default handlers;

/* Mock Websocket Setup */

// const socketServer = new MockSocketServer('ws://localhost')

// let currentSocket:any

// const sendMessage = (socket:any, obj:any) => {
//   socket.send(JSON.stringify(obj))
// }

// Allow our UI to fake the server pushing out some notifications over the websocket,
// as if other users were interacting with the system.
// const sendRandomNotifications = (socket:any, since:any) => {
//   const numNotifications = getRandomInt(1, 5)

//   const notifications = generateRandomNotifications(since, numNotifications, db)

//   sendMessage(socket, { type: 'notifications', payload: notifications })
// }

// export const forceGenerateNotifications = (since:any) => {
//   sendRandomNotifications(currentSocket, since)
// }

// socketServer.on('connection', (socket) => {
//   currentSocket = socket

//   socket.on('message', (data:any) => {
//     const message = JSON.parse(data)

//     switch (message.type) {
//       case 'notifications': {
//         const since = message.payload
//         sendRandomNotifications(socket, since)
//         break
//       }
//       default:
//         break
//     }
//   })
// })

/* Random Notifications Generation */

// const notificationTemplates = [
//   'poked you',
//   'says hi!',
//   `is glad we're friends`,
//   'sent you a gift',
// ]

// function generateRandomNotifications(since, numNotifications, db) {
//   const now = new Date()
//   let pastDate

//   if (since) {
//     pastDate = parseISO(since)
//   } else {
//     pastDate = new Date(now.valueOf())
//     pastDate.setMinutes(pastDate.getMinutes() - 15)
//   }

//   // Create N random notifications. We won't bother saving these
//   // in the DB - just generate a new batch and return them.
//   const notifications = [...Array(numNotifications)].map(() => {
//     const user = randomFromArray(db.user.getAll())
//     const template = randomFromArray(notificationTemplates)
//     return {
//       id: nanoid(),
//       date: faker.date.between(pastDate, now).toISOString(),
//       message: template,
//       user: user.id,
//     }
//   })

//   return notifications
// }
