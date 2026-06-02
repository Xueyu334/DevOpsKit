import lameBundleSource from 'lamejs/lame.all.js?raw'

let lameInstance = null

export function loadLame() {
  if (!lameInstance) {
    lameInstance = new Function(`${lameBundleSource}; return lamejs;`)()
  }
  return lameInstance
}
