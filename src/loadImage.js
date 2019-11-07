import { external } from './externalModules.js';
import arrayBufferToImage from './arrayBufferToImage.js';
import createImage from './createImage.js';

//
// This is a cornerstone image loader for web images such as PNG and JPEG
//
let options = {
  // callback allowing customization of the xhr (e.g. adding custom auth headers, cors, etc)
  beforeSend(/* xhr */) { }
};


// Loads an image given a url to an image
export function loadImage(imageId, sendOptions) {
  const cornerstone = external.cornerstone;

  const xhr = new XMLHttpRequest();

  let urlToCall = imageId;
  if (sendOptions && !isNaN(sendOptions.windowWidth) && !isNaN(sendOptions.windowCenter)) {
    urlToCall += `&windowWidth=${sendOptions.windowWidth}&windowCenter=${sendOptions.windowCenter}`
  }

  const jwtToken = localStorage.getItem('jwt');

  xhr.open('GET', urlToCall, true);
  xhr.responseType = 'arraybuffer';
  if (jwtToken)
    xhr.setRequestHeader('Authorization', 'Bearer ' + jwtToken)
  options.beforeSend(xhr);

  xhr.onprogress = function (oProgress) {
    if (oProgress.lengthComputable) {
      // evt.loaded the bytes browser receive
      // evt.total the total bytes set by the header
      const loaded = oProgress.loaded;
      const total = oProgress.total;
      const percentComplete = Math.round((loaded / total) * 100);

      const eventData = {
        imageId,
        loaded,
        total,
        percentComplete
      };

      cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadprogress', eventData);
    }
  };

  const promise = new Promise((resolve, reject) => {
    xhr.onload = function () {
      const imagePromise = arrayBufferToImage(this.response);

      imagePromise.then((image) => {
        const imageObject = createImage(image, imageId);

        resolve(imageObject);
      }, reject);
    };

    xhr.send();
  });

  const cancelFn = () => {
    xhr.abort();
  };

  return {
    promise,
    cancelFn
  };
}

export function configure(opts) {
  options = opts;
}
