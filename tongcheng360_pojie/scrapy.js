const fs = require('fs');
const https = require('https');

function mkdirs(path) {
    if(!fs.existsSync(path)) {
        if(path.lastIndexOf("/") !== 0 && path.lastIndexOf("/") !== 1) {
            mkdirs(path.substring(0, path.lastIndexOf("/")));
        }
        fs.mkdirSync(path);
    }
}

function getContent(url) {
    let file = decodeURI(url);
    if(file.startsWith("/")) {
        file = '.' + file;
    } else {
        file = './' + file;
    }
    if(fs.existsSync(file)) {
        return ;
    }
    let options = {
        hostname: "tongcheng360.com",
        port: 443,
        path: url,
        method: 'GET'
    }
    return new Promise((rl, rj) => {
        try {
            let req = https.request(options, res => {
                res.on('data', d => {
                    if(d instanceof Buffer) {
                        d = d.toString("utf-8");
                    }
                    let parent = file.substring(0, file.lastIndexOf("/"));
                    if(!fs.existsSync(parent)) {
                        mkdirs(parent);
                    }
                    if(fs.existsSync(file)) {
                        fs.appendFileSync(file, d, 'utf-8');
                    } else {
                        fs.writeFileSync(file, d, 'utf-8');
                    }
                })
                res.on('end', () => {
                    rl(null);
                })
            });
        
            req.on('error', error => {
                console.error(error)
            })
        
            req.end()
        } catch(e) {
            console.error(e);
            rl(null)
        }
    })
}



async function readAndFetchJs(file) {
    let content = fs.readFileSync(file, "utf-8");
    let jsArr = content.split(".css\"");
    let c = jsArr.length, co = 0;
    for(let str of jsArr) {
        if(co >= c - 1) {
            break;
        }
        for(let i = str.length - 1; i >= 0; i--) {
            if(str[i] === '"') {
                let url = str.substring(i + 1, str.length) + ".css";
                await getContent(url);
                break ;
            }
        }
        co++;
    }
}

async function readAndFetchCss(file) {
    let content = fs.readFileSync(file, "utf-8");
    let jsArr = content.split(".js\"");
    let c = jsArr.length, co = 0;
    for(let str of jsArr) {
        if(co >= c - 1) {
            break;
        }
        for(let i = str.length - 1; i >= 0; i--) {
            if(str[i] === '"') {
                let url = str.substring(i + 1, str.length) + ".js";
                await getContent(url);
                break ;
            }
        }
        co++;
    }
}


function fetchIndexHtml(url) {
    return new Promise((rl, rj) => {
        try {
            let options = {
                hostname: "tongcheng360.com",
                port: 443,
                path: url,
                method: 'GET'
            }
            if(!url) {
                options.path = "/zh-CN/area"
            }
            let req = https.request(options, res => {
                res.on('data', d => {
                    if(d instanceof Buffer) {
                        d = d.toString("utf-8");
                    }
                    let file = './index.html'
                    if(url) {
                        let parent = '.' + url;
                        if(!fs.existsSync(parent)) {
                            mkdirs(parent);
                        }
                        file = '.' + url +'/index.html'
                    }
                    if(fs.existsSync(file)) {
                        fs.appendFileSync(file, d, 'utf-8');
                    } else {
                        fs.writeFileSync(file, d, 'utf-8');
                    }
                });

                res.on('end', () => {
                    rl(null);
                });
            });
        
            req.on('error', error => {
                console.error(error)
            })
        
            req.end()
        } catch(e) {
            console.error(e);
            rl(null);
        }
    });
}


async function 走你() {
    console.log("获取根目录index.html");
    await fetchIndexHtml(null);

    console.log("获取各个city数据的index.html, 各个city数据来自于根目录index.html中获取");
    if(!fs.existsSync('./zh-CN')) {
        fs.mkdirSync('./zh-CN')
    }
    let content = fs.readFileSync("./city.json", "utf-8");
    let cities = JSON.parse(content);
    for(let city of cities) {
        await fetchIndexHtml('/zh-CN/'+city.id); 
    }

    console.log("解析根目录html,获取内部的js与css文件");
    
    await readAndFetchJs('./index.html');
    await readAndFetchCss('./index.html');

    for(let city of cities) {
        console.log("解析" +city.city_name+ "的html,获取内部的js与css文件");

        await readAndFetchJs('zh-CN/' + city.id + '/index.html');
        await readAndFetchCss('zh-CN/' + city.id + '/index.html');
    }
}


走你();
