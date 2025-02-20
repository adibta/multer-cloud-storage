"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageEngine = void 0;
var storage_1 = require("@google-cloud/storage");
var uuid_1 = require("uuid");
var urlencode = require("urlencode");
var MulterGoogleCloudStorage = /** @class */ (function () {
    function MulterGoogleCloudStorage(opts) {
        var _this = this;
        this.blobFile = { destination: '', filename: '' };
        this._handleFile = function (req, file, cb) {
            if (_this.setBlobFile(req, file) && _this.setStorageBucket(req, file)) {
                var blobName = _this.blobFile.destination + _this.blobFile.filename;
                var blob = _this.gcsBucket.file(blobName);
                var streamOpts = {
                    predefinedAcl: _this.options.acl
                };
                var contentType = _this.getContentType(req, file);
                if (contentType) {
                    streamOpts.metadata = { contentType: contentType };
                }
                var blobStream = blob.createWriteStream(streamOpts);
                file.stream.pipe(blobStream)
                    .on('error', function (err) { return cb(err); })
                    .on('finish', function (file) {
                    var name = blob.metadata.name;
                    var filename = name.substr(name.lastIndexOf('/') + 1);
                    cb(null, {
                        bucket: blob.metadata.bucket,
                        destination: _this.blobFile.destination,
                        filename: filename,
                        path: "" + _this.blobFile.destination + filename,
                        contentType: blob.metadata.contentType,
                        size: blob.metadata.size,
                        uri: "gs://" + blob.metadata.bucket + "/" + _this.blobFile.destination + filename,
                        linkUrl: "https://storage.googleapis.com/" + blob.metadata.bucket + "/" + _this.blobFile.destination + filename,
                        selfLink: blob.metadata.selfLink,
                    });
                });
            }
        };
        this._removeFile = function (req, file, cb) {
            if (_this.setBlobFile(req, file) && _this.setStorageBucket(req, file)) {
                var blobName = _this.blobFile.destination + _this.blobFile.filename;
                var blob = _this.gcsBucket.file(blobName);
                blob.delete();
            }
        };
        opts = opts || {};
        typeof opts.destination === 'string' ?
            this.getDestination = function (req, file, cb) { cb(null, opts.destination); }
            : this.getDestination = opts.destination || this.getDestination;
        typeof opts.bucket === 'string' ?
            this.getStorageBucket = function (req, file, cb) { cb(null, opts.bucket); }
            : this.getStorageBucket = opts.bucket || this.getStorageBucket;
        if (opts.hideFilename) {
            this.getFilename = function (req, file, cb) { cb(null, "" + uuid_1.v4()); };
            this.getContentType = function (req, file) { return undefined; };
        }
        else {
            typeof opts.filename === 'string' ?
                this.getFilename = function (req, file, cb) { cb(null, opts.filename); }
                : this.getFilename = opts.filename || this.getFilename;
            typeof opts.contentType === 'string' ?
                this.getContentType = function (req, file) { return opts.contentType; }
                : this.getContentType = opts.contentType || this.getContentType;
        }
        opts.projectId = opts.projectId || process.env.GCLOUD_PROJECT || null;
        opts.keyFilename = opts.keyFilename || process.env.GCS_KEYFILE || null;
        if (!opts.projectId) {
            throw new Error('You have to specify project id for Google Cloud Storage to work.');
        }
        if (!opts.keyFilename) {
            throw new Error('You have to specify credentials key file for Google Cloud Storage to work.');
        }
        this.gcsStorage = new storage_1.Storage({
            projectId: opts.projectId,
            keyFilename: opts.keyFilename
        });
        this.options = opts;
    }
    MulterGoogleCloudStorage.prototype.getFilename = function (req, file, cb) {
        if (typeof file.originalname === 'string')
            cb(null, file.originalname);
        else
            cb(null, "" + uuid_1.v4());
    };
    MulterGoogleCloudStorage.prototype.getDestination = function (req, file, cb) {
        cb(null, '');
    };
    MulterGoogleCloudStorage.prototype.getContentType = function (req, file) {
        if (typeof file.mimetype === 'string')
            return file.mimetype;
        else
            return undefined;
    };
    MulterGoogleCloudStorage.prototype.getStorageBucket = function (req, file, cb) {
        cb(null, '');
    };
    MulterGoogleCloudStorage.prototype.setBlobFile = function (req, file) {
        var _this = this;
        this.getDestination(req, file, function (err, destination) {
            if (err) {
                return false;
            }
            var escDestination = '';
            escDestination += destination
                .replace(/^\.+/g, '')
                .replace(/^\/+|\/+$/g, '');
            if (escDestination !== '') {
                escDestination = escDestination + '/';
            }
            _this.blobFile.destination = escDestination;
        });
        this.getFilename(req, file, function (err, filename) {
            if (err) {
                return false;
            }
            _this.blobFile.filename = urlencode(filename
                .replace(/^\.+/g, '')
                .replace(/^\/+/g, '')
                .replace(/\r|\n/g, '_'));
        });
        return true;
    };
    MulterGoogleCloudStorage.prototype.setStorageBucket = function (req, file) {
        var _this = this;
        this.getStorageBucket(req, file, function (err, bucket) {
            if (!bucket) {
                throw new Error('You have to specify bucket for Google Cloud Storage to work.');
            }
            else {
                _this.gcsBucket = _this.gcsStorage.bucket(bucket);
            }
        });
        return true;
    };
    return MulterGoogleCloudStorage;
}());
exports.default = MulterGoogleCloudStorage;
function storageEngine(opts) {
    return new MulterGoogleCloudStorage(opts);
}
exports.storageEngine = storageEngine;
//# sourceMappingURL=index.js.map