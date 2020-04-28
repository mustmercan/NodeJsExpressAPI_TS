import securityCheck from "../controllers/security/securityCheck";

import * as RouteJson from "./routingPaths.json";
interface Path {
    name: string;
    security: boolean;
    paths: Path[] | undefined;
    all: string;
    get: string;
    put: string;
    post: string;
    delete: string;
}

export default class RouterController {
    private router: any;
    private security: any;
    constructor(express: any) {
        this.router = express;
        this.security = securityCheck;

        let routeJson = this.readJson(RouteJson.paths);
        if (routeJson && routeJson.length > 0) {
            this.rescusivePathRegister(routeJson, "");
        }
        return this.router;
    }

    private readJson = (jsonObject: any, childPaths: Path[] | undefined = undefined): Path[] => {
        let paths: Path[] = [];
        let pathsObject = childPaths ? childPaths : jsonObject;
        if (pathsObject && pathsObject.length > 0) {
            pathsObject.forEach((item: any) => {
                let path: Path = {
                    name: item.name as string,
                    security: item.security as boolean,
                    all: item.all as string,
                    get: item.get as string,
                    put: item.put as string,
                    post: item.post as string,
                    delete: item.delete as string,
                    paths: undefined
                };
                if (item.paths && item.paths.length > 0) {
                    path.paths = this.readJson(undefined, item.paths);
                }
                paths.push(path);
            });
        }
        return paths;
    }




    rescusivePathRegister(paths: Path[], parrent: string) {
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
    registerPath(path: Path) {
        let securityCheck = path.security;
        if (securityCheck) {
            if (path.all && path.all != "") {
                this.router.use(path.name, this.security, require(path.all).default);
                console.info(`"${path.name}" is registed "${path.all}" ALL Methods. Security Check True`);
            }
            if (path.get && path.get != "") {
                this.router.get(path.name, this.security, require(path.get).default);
                console.info(`"${path.name}" is registed GET Method. Security Check True`);
            }
            if (path.post && path.post != "") {
                this.router.post(path.name, this.security, require(path.post).default);
                console.info(`"${path.name}" is registed POST Method. Security Check True`);
            }
            if (path.put && path.put != "") {
                this.router.put(path.name, this.security, require(path.put).default);
                console.info(`"${path.name}" is registed PUT Method. Security Check True`);
            }
            if (path.delete && path.delete != "") {
                this.router.delete(path.name, this.security, require(path.delete).default);
                console.info(`"${path.name}" is registed DELETE Method. Security Check True`);
            }
        }
        else {
            if (path.all && path.all != "") {
                this.router.use(path.name, require(path.all).default);
                console.info(`"${path.name}" is registed "${path.all}" ALL Methods.`);
            }
            if (path.get && path.get != "") {
                this.router.get(path.name, require(path.get).default);
                console.info(`"${path.name}" is registed GET Method.`);
            }
            if (path.post && path.post != "") {
                this.router.post(path.name, require(path.post).default);
                console.info(`"${path.name}" is registed POST Method.`);
            }
            if (path.put && path.put != "") {
                this.router.put(path.name, require(path.put).default);
                console.info(`"${path.name}" is registed PUT Method.`);
            }
            if (path.delete && path.delete != "") {
                this.router.delete(path.name, require(path.delete).default);
                console.info(`"${path.name}" is registed DELETE Method.`);
            }
        }

    }


}
