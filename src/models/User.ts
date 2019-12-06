import { v4} from 'uuid'

export class User {
    id: string;
    username: string;
    no_of_connections = 0;

    constructor(username: string) {
        this.id = v4();
        this.username = username;
    }

    updateConnections() {
        this.no_of_connections++;
    }
}