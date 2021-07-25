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

function saveStatus(status, message) {
    let s = {
        status: status,
        message: message
    }

    console.log(JSON.stringify(s))
    fsy.writeFileSync(__dirname + '/status.json', JSON.stringify(s))
}

const requestListener = async function (req, res) {
    console.log('received: ' + req.url)
    const arr = req.url.split('?')
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
            fsy.mkdirSync('public/previews')
            const filename = 'public/previews/preview-' + Math.round(+new Date() / 1000) + '.jpg'
            console.log('starting preview: ' + filename)

            const myCamera = new PiCamera({
                mode: 'photo',
                output: `${__dirname}/` + filename,
                width: 640,
                height: 480,
                nopreview: true,
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
            fsy.mkdirSync('public/timelapses')
            const basePath = 'public/timelapses/' + formatDate()
            fsy.mkdirSync(basePath)
            console.log(basePath)
            const paramArray = arr[1].split('&')
            let params = []
            console.log(paramArray)
            let param;
            for (param of paramArray) {
                const p = param.split('=')
                params[p[0]] = p[1]
            }

            console.log(params)
            const numPics = parseInt((params['runtime'] * 60) / params['interval'])

            console.log(numPics)

            console.log('starting timelapse: ', params, numPics)

            res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end(`{"message": "Starting timelapse with numpics: ` + numPics + `"}`);

            for (let i = 1; i <= numPics; i++) {

                console.log('Taking picture: ' + i)
                let fileName = 'image-' + (i).toString().padStart(4, '0') + '.jpg'
                console.log(fileName)

                saveStatus('running', 'Taking picture: ' + i + '/' + numPics)

                new PiCamera({
                    mode: 'photo',
                    output: basePath + '/' + fileName,
                    width: 640,
                    height: 480,
                    nopreview: true,
                }).snap()
                    .then((result) => {
                        console.log('finished capture')
                    })
                    .catch((error) => {
                        console.log(error)
                    })

                await sleep(params['interval'])
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
                        //res.setHeader("Content-Type", "text/html");
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
