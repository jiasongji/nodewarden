import { Env, SyncResponse, CipherResponse, FolderResponse, ProfileResponse, Attachment } from '../types';
import { StorageService } from '../services/storage';
import { jsonResponse, errorResponse } from '../utils/response';

// Format attachments for API response
function formatAttachments(attachments: Attachment[]): any[] | null {
  if (attachments.length === 0) return null;
  return attachments.map(a => ({
    id: a.id,
    fileName: a.fileName,
    size: Number(a.size) || 0,  // Android expects Int, not String
    sizeName: a.sizeName,
    key: a.key,
    url: `/api/ciphers/${a.cipherId}/attachment/${a.id}`,  // Android requires non-null url!
    object: 'attachment',
  }));
}

// GET /api/sync
export async function handleSync(request: Request, env: Env, userId: string): Promise<Response> {
  const storage = new StorageService(env.VAULT);
  
  const user = await storage.getUserById(userId);
  if (!user) {
    return errorResponse('User not found', 404);
  }

  const ciphers = await storage.getAllCiphers(userId);
  const folders = await storage.getAllFolders(userId);

  // Build profile response
  const profile: ProfileResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: true,
    premium: true,
    premiumFromOrganization: false,
    usesKeyConnector: false,
    masterPasswordHint: null,
    culture: 'en-US',
    twoFactorEnabled: false,
    key: user.key,
    privateKey: user.privateKey,
    accountKeys: null,
    securityStamp: user.securityStamp || user.id,
    organizations: [],
    providers: [],
    providerOrganizations: [],
    forcePasswordReset: false,
    avatarColor: null,
    creationDate: user.createdAt,
    object: 'profile',
  };

  // Build cipher responses with attachments
  const cipherResponses: CipherResponse[] = [];
  for (const cipher of ciphers) {
    const attachments = await storage.getAttachmentsByCipher(cipher.id);
    cipherResponses.push({
      id: cipher.id,
      organizationId: null,
      folderId: cipher.folderId,
      type: Number(cipher.type) || 1,
      name: cipher.name,
      notes: cipher.notes,
      favorite: cipher.favorite,
      login: cipher.login,
      card: cipher.card,
      identity: cipher.identity,
      secureNote: cipher.secureNote,
      sshKey: cipher.sshKey,
      fields: cipher.fields,
      passwordHistory: cipher.passwordHistory,
      reprompt: cipher.reprompt,
      organizationUseTotp: false,
      creationDate: cipher.createdAt,
      revisionDate: cipher.updatedAt,
      deletedDate: cipher.deletedAt,
      archivedDate: null,
      edit: true,
      viewPassword: true,
      permissions: {
        delete: true,
        restore: true,
      },
      object: 'cipher',
      collectionIds: [],
      attachments: formatAttachments(attachments),
      key: cipher.key,
      encryptedFor: null,
    });
  };

  // Build folder responses
  const folderResponses: FolderResponse[] = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    revisionDate: folder.updatedAt,
    object: 'folder',
  }));

  const syncResponse: SyncResponse = {
    profile: profile,
    folders: folderResponses,
    collections: [],
    ciphers: cipherResponses,
    domains: {
      equivalentDomains: [],
      globalEquivalentDomains: [],
      object: 'domains',
    },
    policies: [],
    sends: [],
    userDecryption: {
      masterPasswordUnlock: {
        salt: user.email,
        kdf: {
          kdfType: user.kdfType,
          iterations: user.kdfIterations,
          memory: user.kdfMemory || null,
          parallelism: user.kdfParallelism || null,
        },
        masterKeyEncryptedUserKey: user.key,
      },
    },
    object: 'sync',
  };

  return jsonResponse(syncResponse);
}
