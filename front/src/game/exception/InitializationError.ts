export class InitializationError extends Error {
    constructor(desc: string){
        super();
        this.cause = desc;
    }

    getCause(){ return this.cause; }
};