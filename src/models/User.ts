import { v4} from 'uuid'

export class User {
    id: string;
    username: string;
    connections = [];

    constructor(username: string) {
        this.id = v4();
        this.username = username;
    }
}