const http = require('http');
const fs = require('fs').promises;
const fsy = require('fs');
const PiCamera = require('pi-camera');

const host = '192.168.4.1';
const port = 8000;

function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000))
}

function formatDate() {
    const date = new Date()

    return date.getFullYear()
        + '-' + (date.getMonth() + 1)
        + '-' + date.getDate()
        + '-' + date.getHours()
        + ':' + date.getMinutes()
}

function saveStatus(status, message, fileName) {
    let s = {
        status: status,
        message: message,
        fileName: fileName
    }

    console.log(JSON.stringify(s))
    fsy.writeFileSync(__dirname + '/status.json', JSON.stringify(s))
}

function parseParams(paramString) {
    const paramArray = paramString.split('&')
    let params = []
    console.log(paramArray)
    let param;
    for (param of paramArray) {
        const p = param.split('=')
        params[p[0]] = p[1]
    }

    return params
}

const requestListener = async function (req, res) {
    console.log('received: ' + req.url)
    const arr = req.url.split('?')
    let params
    switch (arr[0]) {
        case '/':
            fs.readFile(__dirname + "/public/index.html")
                .then(contents => {
                    res.setHeader("Content-Type", "text/html");
                    res.writeHead(200);
                    res.end(contents);
                })
                .catch(err => {
                    res.writeHead(500);
                    res.end(err);
                });
            break

        case '/preview':
            params = parseParams(arr[1])

            const filename = 'public/previews/preview-' + Math.round(+new Date() / 1000) + '.jpg'
            console.log('starting preview: ' + filename)

            const myCamera = new PiCamera({
                mode: 'photo',
                output: `${__dirname}/` + filename,
                width: 640,
                height: 480,
                nopreview: true,
                rotation: params['rotation'],
            });

            myCamera.snap()
                .then((result) => {
                    console.log('finished capture')
                    res.setHeader("Content-Type", "application/json");
                    res.writeHead(200);
                    res.end('{"message": "' + filename + '"}');
                    console.log('preview OK')
                })
                .catch((error) => {
                    console.log(error)
                });
            break

        case '/start':
            const basePath = __dirname + '/public/timelapses/' + formatDate()
            fsy.mkdirSync(basePath)

            params = parseParams(arr[1])

            const numPics = parseInt((params['runtime'] * 60) / params['interval'])

            console.log('starting timelapse: ', params, numPics)

            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(`{"message": "Starting timelapse with numpics: ` + numPics + `"}`);

            for (let i = 1; i <= numPics; i++) {
                console.log('Taking picture: ' + i)
                let fileName = 'image-' + (i).toString().padStart(4, '0') + '.jpg'

                saveStatus('running', 'Taking picture: ' + i + '/' + numPics)

                new PiCamera({
                    mode: 'photo',
                    output: basePath + '/' + fileName,
                    width: 1280,
                    height: 720,
                    nopreview: true,
                    rotation: params['rotation'],
                }).snap()
                    .then((result) => {
                        console.log('finished capture')
                        saveStatus('idle', 'Took picture: ' + i + '/' + numPics, basePath + '/' + fileName)
                    })
                    .catch((error) => {
                        console.log(error)
                        saveStatus('error', error)
                    })
                if (i <= numPics) {
                    console.log('sleeping...')
                    //saveStatus('sleeping', 'Sleeping for ' + params['interval'] + ' seconds...')
                    await sleep(params['interval']);
                }
            }

            console.log('Finished!')

            saveStatus('finished', 'Finished!')
            break

        case '/status':
            fs.readFile(__dirname + "/status.json")
                .then(contents => {
                    res.setHeader("Content-Type", "application/json");
                    res.writeHead(200);
                    res.end(contents);
                })
                .catch(err => {
                    res.writeHead(500);
                    res.end(err);
                });
            break

        default:
            const path = __dirname + req.url
            if (fsy.existsSync(path)) {
                fs.readFile(path)
                    .then(contents => {
                        const extension = path.split('.').pop()
                        switch (extension) {
                            case 'css':
                                res.setHeader("Content-Type", "text/css");
                                break
                            case 'js':
                                res.setHeader("Content-Type", "text/javascript");
                                break
                            case 'jpg':
                                res.setHeader("Content-Type", "image/jpeg");
                                break
                            case 'ico':
                                res.setHeader("Content-Type", "image/x-icon");
                                break
                            default:
                            // res.setHeader("Content-Type", "text/html");
                        }
                        res.writeHead(200);
                        res.end(contents);
                    })
                    .catch(err => {
                        res.writeHead(500);
                        res.end(err);
                    });
            } else {
                console.log('404: ' + req.url)
                res.writeHead(200);
                res.end('File not found :(');
            }
            break
    }
}

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
