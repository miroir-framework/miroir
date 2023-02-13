var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { rest } from 'msw';
import { IndexedDb } from '../../4_services/localStore/indexedDb';
const ARTIFICIAL_DELAY_MS = 100;
const serializePost = (post) => (Object.assign(Object.assign({}, post), { user: post.user.id }));
export class IndexedDbObjectStore {
    constructor(rootApiUrl) {
        this.rootApiUrl = rootApiUrl;
        this.localIndexedStorage = new IndexedDb('miroir');
        this.handlers = [
            rest.get(this.rootApiUrl + '/' + 'Entity/all', (req, res, ctx) => __awaiter(this, void 0, void 0, function* () {
                console.log('Entity/all started');
                const localData = yield this.localIndexedStorage.getAllValue('Entity');
                console.log('server Entity/all', localData);
                return res(ctx.json(localData));
            })),
            rest.get(this.rootApiUrl + '/' + 'Report/all', (req, res, ctx) => __awaiter(this, void 0, void 0, function* () {
                const localData = yield this.localIndexedStorage.getAllValue('Report');
                return res(ctx.delay(ARTIFICIAL_DELAY_MS), ctx.json(localData));
            })),
        ];
    }
    createObjectStore(tableNames) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.localIndexedStorage.createObjectStore(tableNames);
        });
    }
    closeObjectStore() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.localIndexedStorage.closeObjectStore();
        });
    }
    openObjectStore() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.localIndexedStorage.openObjectStore();
        });
    }
}
