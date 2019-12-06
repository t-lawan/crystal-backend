import { v4} from 'uuid'

export class User {
    id: string;
    name: string;
    no_of_connections = 0;

    constructor(name: string) {
        this.id = v4();
        this.name = name;
    }

    updateConnections() {
        this.no_of_connections++;
    }
}