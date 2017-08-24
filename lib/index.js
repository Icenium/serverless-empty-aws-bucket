"use strict";

const S3Service = require("./services/s3-service");

class EmptyAwsBucketPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        this.commands = {
            "empty-bucket": {
                usage: "Creates custom domain name resource in API Gateway. This requires a certificate in Amazon Certificate Manager to be registered.",
                lifecycleEvents: [
                    "empty-bucket"
                ]
            }
        };

        this.hooks = {
            "empty-bucket:empty-bucket": this.cleanBucket.bind(this),
            "before:remove:remove": this.cleanBucketHook.bind(this)
        };
    }

    async cleanBucketHook() {
        const s3Service = new S3Service(this.serverless, this.options);
        if (s3Service.config.ignoreHooks) {
            return;
        }

        await s3Service.cleanBucketAsync();
    }

    async cleanBucket() {
        const s3Service = new S3Service(this.serverless, this.options);
        if (s3Service.config.ignoreHooks) {
            return;
        }

        await s3Service.cleanBucketAsync();
    }
}

module.exports = EmptyAwsBucketPlugin;
