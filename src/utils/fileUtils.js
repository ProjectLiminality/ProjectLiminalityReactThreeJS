import * as electronService from '../services/electronService';

const preferredExtensions = ['.gif', '.mp4', '.png', '.jpg', '.jpeg', '.webp'];

export async function getRepoData(repoName) {
  try {
    const metadata = await electronService.readMetadata(repoName);
    const dreamTalkMedia = await getAllMediaFiles(repoName);
    const dreamSongCanvas = await readDreamSongCanvas(repoName);
    const dreamSongMedia = await getDreamSongMedia(repoName);
    console.log(`DreamTalk media for ${repoName}:`, dreamTalkMedia);
    return { metadata, dreamTalkMedia, dreamSongCanvas, dreamSongMedia };
  } catch (error) {
    console.error('Error getting repo data:', error);
    return { metadata: {}, dreamTalkMedia: [], dreamSongCanvas: null, dreamSongMedia: [] };
  }
}

async function getDreamSongMedia(repoName) {
  try {
    const canvasData = await readDreamSongCanvas(repoName);
    if (!canvasData || !canvasData.nodes) {
      return [];
    }

    const fileNodes = canvasData.nodes.filter(node => node.type === 'file' && node.file);
    const mediaPromises = fileNodes.map(async node => {
      const filePath = node.file.startsWith(repoName + '/') ? node.file.slice(repoName.length + 1) : node.file;
      const mediaPath = await electronService.getDreamSongMediaFilePath(repoName, filePath);
      if (!mediaPath) {
        return null;
      }

      const mediaData = await electronService.readFile(mediaPath);
      if (!mediaData) {
        return null;
      }

      const fileExtension = filePath.split('.').pop().toLowerCase();
      const mimeType = getMimeType(fileExtension);

      return {
        id: node.id,
        type: mimeType,
        filePath: node.file,
        data: mediaData,
        mimeType: mimeType
      };
    });

    const mediaContents = await Promise.all(mediaPromises);
    return mediaContents.filter(media => media !== null);
  } catch (error) {
    return [];
  }
}

function getMimeType(fileExtension) {
  const mimeTypes = {
    'mp4': 'video/mp4',
    'gif': 'image/gif',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp'
  };
  return mimeTypes[fileExtension] || 'application/octet-stream';
}

async function getAllMediaFiles(repoName) {
  try {
    const files = await electronService.listFiles(repoName);
    const rootMediaFiles = files.filter(file => 
      !file.includes('/') && preferredExtensions.some(ext => file.toLowerCase().endsWith(ext))
    );

    const mediaPromises = rootMediaFiles.map(async file => {
      const mediaPath = await electronService.getMediaFilePath(repoName, file);
      console.log("mediaPath", mediaPath)
      if (!mediaPath) {
        console.log(`No media path found for file: ${file}`);
        return null;
      }

      const mediaData = await electronService.readFile(mediaPath);
      if (!mediaData) {
        console.log(`No media data found for file: ${file}`);
        return null;
      }

      const fileExtension = file.split('.').pop().toLowerCase();
      const mimeType = getMimeType(fileExtension);

      console.log(`Processed media file: ${file}, type: ${mimeType}`);

      return {
        type: mimeType,
        path: mediaPath,
        data: `data:${mimeType};base64,${mediaData}`,
        filename: file
      };
    });

    const mediaFiles = (await Promise.all(mediaPromises)).filter(media => media !== null);

    // Sort media files
    mediaFiles.sort((a, b) => {
      const aNameMatch = a.filename.toLowerCase() === repoName.toLowerCase();
      const bNameMatch = b.filename.toLowerCase() === repoName.toLowerCase();
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return a.filename.localeCompare(b.filename);
    });

    console.log(`Total media files found for ${repoName}:`, mediaFiles.length);
    return mediaFiles;
  } catch (error) {
    console.error('Error getting all media files:', error);
    return [];
  }
}

export async function readDreamSongCanvas(repoName) {
  try {
    const canvasContent = await electronService.readDreamSongCanvas(repoName);
    if (!canvasContent || canvasContent.trim() === '') {
      console.log(`DreamSong.canvas is empty or not found for ${repoName}`);
      return null;
    }
    return JSON.parse(canvasContent);
  } catch (error) {
    console.error(`Error reading DreamSong.canvas for ${repoName}:`, error);
    return null;
  }
}

export async function listFiles(repoName) {
  return electronService.listFiles(repoName);
}

export async function getDirectoryStructure(repoName) {
  return electronService.getDirectoryStructure(repoName);
}

export async function listMediaFiles(repoName) {
  try {
    const files = await electronService.listFiles(repoName);
    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.webm', '.ogg'];
    return files.filter(file => 
      mediaExtensions.some(ext => file.toLowerCase().endsWith(ext))
    ).map(file => `${repoName}/${file}`);
  } catch (error) {
    return [];
  }
}

export async function addFileToNode(nodeName, file) {
  try {
    if (!nodeName || !file) {
      throw new Error('Both nodeName and file are required');
    }

    const result = await electronService.addFileToNode(nodeName, file);
    
    if (result) {
      const stageResult = await electronService.stageFile(nodeName, file.name);
      if (stageResult) {
        const commitMessage = `Added ${file.name}`;
        const commitResult = await electronService.commitChanges(nodeName, commitMessage);
        if (commitResult) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}
