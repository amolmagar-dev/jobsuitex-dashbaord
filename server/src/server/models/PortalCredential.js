// models/PortalCredential.js
import fastify from 'fastify';
import crypto from 'crypto';

/**
 * PortalCredential Schema Definition for MongoDB
 * 
 * This model stores credentials for various job portals securely.
 * Passwords are encrypted before storage.
 */
export const portalCredentialSchema = {
    user: { type: 'string', required: true }, // Reference to user ID
    portal: {
        type: 'string',
        enum: ['naukri', 'linkedin', 'indeed', 'monster'],
        default: 'naukri',
        required: true
    },
    username: { type: 'string', required: true },
    password: { type: 'string', required: true }, // Encrypted
    cookies: { type: 'string' }, // Stored session cookies (encrypted)
    lastVerified: { type: 'date' },
    isValid: { type: 'boolean', default: true },
    createdAt: { type: 'date', default: Date.now },
    updatedAt: { type: 'date', default: Date.now }
};

/**
 * Register PortalCredential collection in Fastify
 * @param {FastifyInstance} app - Fastify instance
 */
export function registerPortalCredentialModel(app) {
    // Create compound index for user+portal to ensure uniqueness
    app.ready().then(() => {
        app.mongo.db.collection('portalCredentials').createIndex(
            { user: 1, portal: 1 },
            { unique: true }
        );
    });
}

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @param {string} secretKey - Encryption key
 * @returns {string} Encrypted string
 */
function encrypt(text, secretKey) {
    try {
        const algorithm = 'aes-256-ctr';
        const iv = crypto.randomBytes(16);
        const key = crypto.createHash('sha256').update(secretKey).digest('base64').substr(0, 32);

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt sensitive data
 * @param {string} text - Encrypted text
 * @param {string} secretKey - Encryption key
 * @returns {string} Decrypted string
 */
function decrypt(text, secretKey) {
    try {
        const algorithm = 'aes-256-ctr';
        const key = crypto.createHash('sha256').update(secretKey).digest('base64').substr(0, 32);

        const [ivHex, encryptedHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * PortalCredential helper functions that work with Fastify's MongoDB plugin
 */
export const PortalCredentialModel = {
    /**
     * Create or update portal credentials
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @param {Object} credentialData - Credential data
     * @returns {Promise<Object>} Operation result
     */
    async saveCredential(app, userId, credentialData) {
        const secretKey = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-encryption-key';
        const now = new Date();

        // Check if credentials already exist for this user and portal
        const existingCred = await app.mongo.db.collection('portalCredentials').findOne({
            user: userId,
            portal: credentialData.portal
        });

        // Encrypt sensitive data
        const encryptedPassword = encrypt(credentialData.password, secretKey);
        const encryptedCookies = credentialData.cookies ?
            encrypt(credentialData.cookies, secretKey) : null;

        if (existingCred) {
            // Update existing credentials
            return await app.mongo.db.collection('portalCredentials').updateOne(
                { _id: existingCred._id },
                {
                    $set: {
                        username: credentialData.username,
                        password: encryptedPassword,
                        cookies: encryptedCookies,
                        lastVerified: now,
                        isValid: true,
                        updatedAt: now
                    }
                }
            );
        } else {
            // Create new credentials
            return await app.mongo.db.collection('portalCredentials').insertOne({
                user: userId,
                portal: credentialData.portal,
                username: credentialData.username,
                password: encryptedPassword,
                cookies: encryptedCookies,
                lastVerified: now,
                isValid: true,
                createdAt: now,
                updatedAt: now
            });
        }
    },

    /**
     * Get credentials for a specific portal
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @param {string} portal - Portal name
     * @returns {Promise<Object>} Credential data
     */
    async getCredential(app, userId, portal) {
        const credential = await app.mongo.db.collection('portalCredentials').findOne({
            user: userId,
            portal
        });

        if (!credential) {
            return null;
        }

        // Don't return the password for security reasons
        return {
            id: credential._id,
            portal: credential.portal,
            username: credential.username,
            lastVerified: credential.lastVerified,
            isValid: credential.isValid,
            createdAt: credential.createdAt,
            updatedAt: credential.updatedAt
        };
    },

    /**
     * Get all credentials for a user
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of credentials
     */
    async getAllCredentials(app, userId) {
        const credentials = await app.mongo.db.collection('portalCredentials')
            .find({ user: userId })
            .toArray();

        // Remove passwords from results
        return credentials.map(cred => ({
            id: cred._id,
            portal: cred.portal,
            username: cred.username,
            lastVerified: cred.lastVerified,
            isValid: cred.isValid,
            createdAt: cred.createdAt,
            updatedAt: cred.updatedAt
        }));
    },

    /**
     * Delete credentials
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} credentialId - Credential ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Delete result
     */
    async deleteCredential(app, credentialId, userId) {
        return await app.mongo.db.collection('portalCredentials').deleteOne({
            _id: new app.mongo.ObjectId(credentialId),
            user: userId
        });
    },

    /**
     * Mark credentials as invalid (e.g., when login fails)
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @param {string} portal - Portal name
     * @returns {Promise<Object>} Update result
     */
    async markInvalid(app, userId, portal) {
        return await app.mongo.db.collection('portalCredentials').updateOne(
            { user: userId, portal },
            {
                $set: {
                    isValid: false,
                    updatedAt: new Date()
                }
            }
        );
    },

    /**
     * Validate credentials (for internal use when logging in to portals)
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @param {string} portal - Portal name
     * @returns {Promise<Object>} Credential with decrypted password for login
     */
    async getLoginCredentials(app, userId, portal) {
        const secretKey = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-encryption-key';

        const credential = await app.mongo.db.collection('portalCredentials').findOne({
            user: userId,
            portal,
            isValid: true
        });

        if (!credential) {
            return null;
        }

        try {
            // Decrypt password for login
            const decryptedPassword = decrypt(credential.password, secretKey);

            // Decrypt cookies if they exist
            const decryptedCookies = credential.cookies ?
                decrypt(credential.cookies, secretKey) : null;

            return {
                id: credential._id,
                portal: credential.portal,
                username: credential.username,
                password: decryptedPassword,
                cookies: decryptedCookies,
                lastVerified: credential.lastVerified
            };
        } catch (error) {
            console.error('Error decrypting credentials:', error);
            throw new Error('Failed to decrypt credentials');
        }
    },

    /**
     * Update cookies after successful login
     * @param {FastifyInstance} app - Fastify instance
     * @param {string} userId - User ID
     * @param {string} portal - Portal name
     * @param {string} cookies - Serialized cookies
     * @returns {Promise<Object>} Update result
     */
    async updateCookies(app, userId, portal, cookies) {
        const secretKey = process.env.CREDENTIAL_ENCRYPTION_KEY || 'default-encryption-key';
        const encryptedCookies = encrypt(cookies, secretKey);

        return await app.mongo.db.collection('portalCredentials').updateOne(
            { user: userId, portal },
            {
                $set: {
                    cookies: encryptedCookies,
                    lastVerified: new Date(),
                    isValid: true,
                    updatedAt: new Date()
                }
            }
        );
    }
};

export default PortalCredentialModel;