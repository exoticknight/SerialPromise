export interface PromiseGenerator {
    (any: any): Promise<any>;
}
export declare enum StatusCode {
    RESOLVE = 0,
    REJECT = 1,
    TIMEOUT = -1
}
export declare type Progress = {
    total: number;
    resolve: number[];
    reject: number[];
    timeout: number[];
};
export interface iOnProgress {
    (value: Progress): boolean | void;
}
export default function SerialPromise(promises: PromiseGenerator[], timeouts?: number[], wait?: number[] | number, onProgress?: iOnProgress): Promise<any>;
