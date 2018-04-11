"use strict";

class S3Service {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.logger = this.serverless.cli;
        this.provider = this.provider = this.serverless.providers.aws;
        this.config = this._loadPluginConfiguration();
    }

    async cleanBucketsAsync() {
        for (const b of this.config.buckets) {
            await this.cleanBucketAsync(b);
        }
    }

    async cleanBucketAsync(bucket) {
        const maxObjectsCount = 1000;
        const params = {
            Bucket: bucket,
            MaxKeys: maxObjectsCount
        };
        let hasDeletedObjects = false;
        this.logger.log(`Removing S3 items from bucket ${bucket}...`);
        while (true) {
            let objects = [];
            try {
                const result = await this.provider.request("S3", "listObjects", params);
                objects = result.Contents;
            } catch (err) {
                this._throwServerlessError(`Unable to list objects in bucket ${bucket}. Error: ${err.message}`);
            }

            if (!objects || !objects.length) {
                break;
            }

            try {
                const objectsToDelete = objects.map(o => ({ Key: o.Key }));
                const deleteParams = {
                    Bucket: bucket,
                    Delete: {
                        Objects: objectsToDelete
                    }
                };

                // We can delete up to 1000 objects from S3.
                await this.provider.request("S3", "deleteObjects", deleteParams);
            } catch (err) {
                this._throwServerlessError(`Unable to delete objects from bucket ${bucket}. Error: ${err.message}`);
            }

            hasDeletedObjects = true;
        }

        if (hasDeletedObjects) {
            this.logger.log(`S3 Bucket ${params.Bucket} cleaned.`);
        } else {
            this.logger.log("Nothing to delete.");
        }
    }

    _loadPluginConfiguration() {
        this._validateConfig();

        const config = this.serverless.service.custom.emptyAwsBucketConfig;
        if (!config.buckets) {
            config.buckets = [];
        }

        if (config.bucket) {
            config.buckets.push(config.bucket);
        }

        const s = new Set(config.buckets);
        config.buckets = [...s];
        return this.serverless.service.custom.emptyAwsBucketConfig;
    }

    _validateConfig() {
        const config = this.serverless.service.custom.emptyAwsBucketConfig;
        if (!config) {
            this._throwServerlessError("Please provide emptyAwsBucketConfig in the custom property of your service.");
        }

        // Keep the config.bucket for backwards compatibility.
        if (!config.bucket && (!config.buckets || config.buckets.length === 0)) {
            this._throwServerlessError("Please provide atleast one bucket in the buckets proeprty or set the bucket property.");
        }
    }

    _throwServerlessError(message) {
        throw new this.serverless.classes.Error(message);
    }
}

module.exports = S3Service;
