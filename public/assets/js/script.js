let requestLoop
const baseURI = 'http://192.168.4.1:8000'

function preview() {
    document.getElementById("preview").src = ''
    const url = baseURI + '/preview?rotation=' + document.getElementById("rotation").value
    fetch(url).then(function (response) {
        console.log(response)
        return response.json();
    }).then(function (data) {
        console.log(data);
        console.log(data.message);
        document.getElementById("preview").src = data.message
    }).catch(function (e) {
        console.log('Booo', e);
    });
}

function startIt() {
    const url = baseURI + '/start'
        + '?runtime=' + document.getElementById('runtime').value
        + '&interval=' + document.getElementById('interval').value
        + '&rotation=' + document.getElementById('rotation').value
    fetch(url).then(function (response) {
        console.log(response)
        return response.json();
    }).then(function (data) {
        console.log(data);
        console.log(data.message);
        // document.getElementById("resultMessage").innerHTML = data.message;
        requestLoop = setInterval(function () {
            fetch(baseURI + '/status')
                .then(function (response) {
                    console.log(response)
                    return response.json();
                })
                .then(function (data) {
                    console.log(data);
                    console.log(data.message);
                    const statusElement = document.getElementById("status")
                    statusElement.innerHTML = data.message
                    statusElement.classList.add('alert-warning')
                    if (data.fileName) {
                        document.getElementById("preview").src = data.fileName
                    }
                    if (data.status === 'idle') {
                        statusElement.classList.remove('alert-warning');
                        statusElement.classList.add('alert-info');
                    }
                    if (data.status === 'finished') {
                        clearInterval(requestLoop);
                        statusElement.classList.remove('alert-warning');
                        statusElement.classList.remove('alert-info');
                        statusElement.classList.add('alert-success');
                    }
                    if (data.error) {

                    }
                }).catch(function (e) {
                console.log(e)
            });
        }, 2000);
    }).catch(function (e) {
        console.log(e)
        document.getElementById("resultMessage").innerHTML = e
    });
}

document.getElementById('btnPreview').addEventListener('click', preview, true);
document.getElementById('start').addEventListener('click', startIt, true);
