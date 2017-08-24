"use strict";

class S3Service {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.logger = this.serverless.cli;
        this.provider = this.provider = this.serverless.providers.aws;
        this.config = this._loadPluginConfiguration();
    }

    async cleanBucketAsync() {
        const maxObjectsCount = 1000;
        const params = {
            Bucket: this.config.bucket,
            MaxKeys: maxObjectsCount
        };
        let hasDeletedObjects = false;

        this.logger.log("Removing S3 items...");
        while (true) {
            let objects = [];
            try {
                const result = await this.provider.request("S3", "listObjects", params);
                objects = result.Contents;
            } catch (err) {
                this._throwServerlessError(`Unable to list objects in bucket ${this.config.bucket}. Error: ${err.message}`);
            }

            if (!objects || !objects.length) {
                break;
            }

            try {
                const objectsToDelete = objects.map(o => ({ Key: o.Key }));
                const params = {
                    Bucket: this.config.bucket,
                    Delete: {
                        Objects: objectsToDelete
                    }
                };

                // We can delete up to 1000 objects from S3.
                await this.provider.request("S3", "deleteObjects", params);
            } catch (err) {
                this._throwServerlessError(`Unable to delete objects from bucket ${this.config.bucket}. Error: ${err.message}`);
            }

            hasDeletedObjects = true;
        }

        if (hasDeletedObjects) {
            this.logger.log(`S3 Bucket ${this.config.bucket} cleaned.`);
        } else {
            this.logger.log("Nothing to delete.");
        }
    }

    _loadPluginConfiguration() {
        this._validateConfig();
        return this.serverless.service.custom.emptyAwsBucketConfig;
    }

    _validateConfig() {
        const config = this.serverless.service.custom.emptyAwsBucketConfig;
        if (!config) {
            this._throwServerlessError("Please provide emptyAwsBucketConfig in the custom property of your service.");
        }

        if (!config.bucket) {
            this._throwServerlessError("Please provide bucket name.");
        }
    }

    _throwServerlessError(message) {
        throw new this.serverless.classes.Error(message);
    }
}

module.exports = S3Service;
