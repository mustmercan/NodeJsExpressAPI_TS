"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const securityCheck_1 = __importDefault(require("../controllers/security/securityCheck"));
const RouteJson = __importStar(require("./routingPaths.json"));
class RouterController {
    constructor(express) {
        this.readJson = (jsonObject, childPaths = undefined) => {
            let paths = [];
            let pathsObject = childPaths ? childPaths : jsonObject;
            if (pathsObject && pathsObject.length > 0) {
                pathsObject.forEach((item) => {
                    let path = {
                        name: item.name,
                        security: item.security,
                        all: item.all,
                        get: item.get,
                        put: item.put,
                        post: item.post,
                        delete: item.delete,
                        paths: undefined
                    };
                    if (item.paths && item.paths.length > 0) {
                        path.paths = this.readJson(undefined, item.paths);
                    }
                    paths.push(path);
                });
            }
            return paths;
        };
        this.router = express;
        this.security = securityCheck_1.default;
        let routeJson = this.readJson(RouteJson.paths);
        if (routeJson && routeJson.length > 0) {
            this.rescusivePathRegister(routeJson, "");
        }
        return this.router;
    }
    rescusivePathRegister(paths, parrent) {
        paths.forEach(path => {
            if (parrent && parrent != "") {
                path.name = parrent + "/" + path.name;
            }
            else {
                path.name = "/" + path.name;
            }
            this.registerPath(path);
            if (path.paths && path.paths.length > 0) {
                this.rescusivePathRegister(path.paths, path.name);
            }
        });
    }
    registerPath(path) {
        let securityCheck = path.security;
        if (securityCheck) {
            if (path.all && path.all != "") {
                this.router.use(path.name, this.security, require(path.all));
                console.info(`"${path.name}" is registed "${path.all}" ALL Methods. Security Check True`);
            }
            if (path.get && path.get != "") {
                this.router.get(path.name, this.security, require(path.get));
                console.info(`"${path.name}" is registed GET Method. Security Check True`);
            }
            if (path.post && path.post != "") {
                this.router.post(path.name, this.security, require(path.post));
                console.info(`"${path.name}" is registed POST Method. Security Check True`);
            }
            if (path.put && path.put != "") {
                this.router.put(path.name, this.security, require(path.put));
                console.info(`"${path.name}" is registed PUT Method. Security Check True`);
            }
            if (path.delete && path.delete != "") {
                this.router.delete(path.name, this.security, require(path.delete));
                console.info(`"${path.name}" is registed DELETE Method. Security Check True`);
            }
        }
        else {
            if (path.all && path.all != "") {
                this.router.use(path.name, require(path.all));
                console.info(`"${path.name}" is registed "${path.all}" ALL Methods.`);
            }
            if (path.get && path.get != "") {
                this.router.get(path.name, require(path.get));
                console.info(`"${path.name}" is registed GET Method.`);
            }
            if (path.post && path.post != "") {
                this.router.post(path.name, require(path.post));
                console.info(`"${path.name}" is registed POST Method.`);
            }
            if (path.put && path.put != "") {
                this.router.put(path.name, require(path.put));
                console.info(`"${path.name}" is registed PUT Method.`);
            }
            if (path.delete && path.delete != "") {
                this.router.delete(path.name, require(path.delete));
                console.info(`"${path.name}" is registed DELETE Method.`);
            }
        }
    }
}
exports.default = RouterController;
//# sourceMappingURL=routing.js.map