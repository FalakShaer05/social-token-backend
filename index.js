// *****************************************
// File name: index.js
// Author: Shehryar Nadeem Iqbal
// Date: 12/03/2021
// Description:
// The main script acts as a RESTful API
// server. Handles HTTP requests. Uses
// Passport for user registration and
// authentication.
// ******************************************
// *****************************************
// LOAD REQUIRED PACKAGES
// *****************************************

const logger = require(`morgan`);
const express = require(`express`);
const session = require(`express-session`);
const cookieParser = require(`cookie-parser`);
const mongoose = require(`mongoose`);
mongoose.Promise = Promise;
const MongoStore = require(`connect-mongo`);
const passport = require(`passport`);
const bodyParser = require(`body-parser`);
const url = require(`url`);
const tunnel = require(`tunnel-ssh`);
const settings = require(`./server-settings`);
const {token} = require(`morgan`);
const app = express();
require(`dotenv`).config();

const port = process.env.PORT || settings.server.port || 3000;
process.env.NODE_ENV !== `development` && (console.log = () => null);

app.use((req, res, next) => {
    if (req._parsedUrl.pathname.includes(`users`)) {
        Console.log(req);
    }
    res.setHeader(`Access-Control-Allow-Origin`, "*");
    res.setHeader(
        `Access-Control-Allow-Methods`,
        `GET, POST, OPTIONS, PUT, PATCH, DELETE, OPTIONS`
    );
    res.setHeader(`Access-Control-Expose-Headers`, `Content-Length, X-JSON`);
    res.setHeader(
        `Access-Control-Allow-Headers`,
        `Origin,X-Auth-Token,X-Requested-With,Content-Type,Authorization`
    );
    res.setHeader(`Access-Control-Allow-Credentials`, true);
    if (req.method === `OPTIONS`) {
        res.status(200).send();
        return;
    }
    next();
});

function startServer(db, dbConnectString) {
    app.use(cookieParser(`${settings.server.name} SessionSecret`));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(
        session({
            store: MongoStore.create({mongoUrl: dbConnectString}),
            name: `${settings.server.name} Cookie`,
            secret: `${settings.server.name} SessionSecret`,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                maxAge: settings.server.sessionDurationSeconds * 1000,
            },
        })
    );

    app.use(passport.initialize());
    app.use(passport.session());
    const env = process.env.NODE_ENV || `dev`;
    if (env === `dev`) {
        app.use(logger(`dev`));
    }
    app.use((req, res, next) => {
        let {session} = req;
        if (!session) {
            session = req.session = {};
        }
        next();
    });
    app.use((req, res, next) => {
        req.database = db;
        next();
    });
    const cleanup = function () {
        db.close();
        process.exit();
    };
    process.on(`SIGINT`, cleanup);
    process.on(`SIGTERM`, cleanup);

    // Welcome Route
    app.get(`/`, (req, res) => {
        let welcome_message = {
            Message: "Welcome to the NFT Marketplace Restful API's",
            Version: '1.0.0'
        }
        res.send(welcome_message)
    });

    // Heard beat Route
    app.get(`/heartbeat`, (req, res) => res.sendStatus(200));

    // Backend Routes
    const PublicRouter = require("./v1/routes/router-public")(db, settings);
    const PrivateRouter = require("./v1/routes/router-private")(db, settings);
    app.use(`/v1`, PublicRouter);
    app.use("/v1", PrivateRouter);

    // Catch 404 routing error
    app.use((req, res, next) => {
        const err = new Error(`Not Found`);
        err.status = 404;
        res.json(err);
        next(err);
    });

    if (app.get(`env`) === `development`) {
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            res.json({message: err.message, error: err});
        });
    }

    app.use((err, req, res, next) => {
        res.status(err.status || 404);
        res.send();
    });

    app.listen(port);
    console.log(`${settings.server.name} is listening on` + ` port ${port}...`);
}

function startDB(config, next) {
    mongoose.connect(config.db.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    db.on(`error`, (err) => {
        console.log(err.stack);
        db.close();
        process.exit(1);
    });

    db.once(`open`, () => {
        console.log(`Connected to database.....`);
        next(db, config.db.connectionString);
    });
}

if (settings.server.ssh.enabled) {
    const config = {
        username: settings.server.ssh.user,
        password: settings.server.ssh.password,
        host: settings.database.url,
        port: 22,
        dstHost: `localhost`,
        dstPort: settings.database.port,
        tryKeyboard: true,
    };

    const tnl = tunnel(config, (error, server) => {
        if (error) {
            console.error(`SSH connection error:`, error);

            return;
        }

        startDB({db: {url: `localhost`, port: config.dstPort}}, startServer);
    });

    tnl.on(`error`, (err) => {
        console.error(`An error occured when running the server =>`, err);
        tnl.close();
        process.exit(1);
    });

    tnl.on(`keyboard-interactive`, (name, descr, lang, prompts, finish) => {
        const {password} = config;
        return finish([password]);
    });
} else {
    console.log(settings.database.connectionString);
    startDB(
        {db: {connectionString: settings.database.connectionString}},
        startServer
    );
}

// Scheduler
// cron.schedule(`* * * * * *`, async () => {
//
// })
