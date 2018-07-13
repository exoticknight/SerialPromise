export interface PromiseGenerator {
  (any):Promise<any>
}

export enum StatusCode {
  RESOLVE = 0,
  REJECT = 1,
  TIMEOUT = -1,
}

type ResolveResult = {
  status:StatusCode.RESOLVE
  data:any
}

type RejectResult = {
  status:StatusCode.REJECT
  error:any
}

type TimeoutResult = {
  status:StatusCode.TIMEOUT
  timeout:number
}

interface Resolver {
  (result:ResolveResult|RejectResult|TimeoutResult):void
}

export type Progress = {
  total:number
  resolve:number[]
  reject:number[]
  timeout:number[]
}

export interface iOnProgress {
  (value:Progress):boolean|void
}

export default function SerialPromise(
  promises:PromiseGenerator[],
  timeouts:number[]=[],
  wait:number[]|number=0,
  onProgress:iOnProgress=()=>void 0
):Promise<any> {
  return new Promise((resolve) => {
    const totalCount = promises.length
    const resolveQueue = []
    const rejectQueue = []
    const timeoutQueue = []
    const rets = []
    rets[-1] = null
    const waitTimes = Array.isArray(wait) ? wait : [0, ...Array(promises.length-1).fill(wait)]

    function worker(i) {
      let stop = false
      let timer

      let ret
      if (timeouts[i]) {
        let timeoutHandler
        let end = false
        ret = [
          new Promise((resolve:Resolver) => {
            timeoutHandler = setTimeout(() => {
              if (!end) {
                end = true
                timeoutQueue.push(i)
                onProgress({
                  total: totalCount,
                  resolve: resolveQueue.slice(0),
                  reject: rejectQueue.slice(0),
                  timeout: timeoutQueue.slice(0),
                })
                resolve({ status: StatusCode.TIMEOUT, timeout:timeouts[i] })
              }
            }, timeouts[i])
          }),
          new Promise((resolve:Resolver) => {
            promises[i](rets[i-1]).then(d => {
              if (!end) {
                end = true
                clearTimeout(timeoutHandler)
                resolveQueue.push(i)
                onProgress({
                  total: totalCount,
                  resolve: resolveQueue.slice(0),
                  reject: rejectQueue.slice(0),
                  timeout: timeoutQueue.slice(0),
                })
                resolve({ status: StatusCode.RESOLVE, data: d })
              }
            }).catch(d => {
              if (!end) {
                end = true
                clearTimeout(timeoutHandler)
                rejectQueue.push(i)
                onProgress({
                  total: totalCount,
                  resolve: resolveQueue.slice(0),
                  reject: rejectQueue.slice(0),
                  timeout: timeoutQueue.slice(0),
                })
                resolve({ status: StatusCode.REJECT, error: d })
              }
            })
          }),
        ]
      } else {
        ret = [
          new Promise((resolve:Resolver) => {
            promises[i](rets[i-1]).then(d => {
              resolveQueue.push(i)
              onProgress({
                total: totalCount,
                resolve: resolveQueue.slice(0),
                reject: rejectQueue.slice(0),
                timeout: timeoutQueue.slice(0),
              })
              resolve({ status: StatusCode.RESOLVE, data: d })
            }).catch(d => {
              rejectQueue.push(i)
              onProgress({
                total: totalCount,
                resolve: resolveQueue.slice(0),
                reject: rejectQueue.slice(0),
                timeout: timeoutQueue.slice(0),
              })
              resolve({ status: StatusCode.REJECT, error: d })
            })
          })
        ]
      }
      Promise.race(ret).then(result => {
        rets.push(result)
        if (stop || promises.length === i + 1) {
          clearTimeout(timer)
          delete rets[-1]
          resolve(rets)
        } else {
          timer = setTimeout(() => {
            clearTimeout(timer)
            timer = null
            worker(i + 1)
          }, waitTimes[i] || 0);
        }
      })
    }

    worker(0)
  })

}