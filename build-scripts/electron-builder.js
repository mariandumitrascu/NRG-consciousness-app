const { build } = require('electron-builder');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

// Build configuration for different platforms
const buildConfig = {
  appId: 'org.rng-consciousness.research-app',
  productName: 'RNG Consciousness Research',
  copyright: 'Copyright © 2024 RNG Consciousness Research',
  directories: {
    output: 'dist',
    buildResources: 'build-resources'
  },
  files: [
    'dist/**/*',
    'node_modules/**/*',
    'package.json'
  ],
  extraResources: [
    {
      from: 'data/calibration',
      to: 'data/calibration'
    },
    {
      from: 'docs',
      to: 'docs'
    }
  ],

  // macOS configuration
  mac: {
    category: 'public.app-category.education',
    icon: 'build-resources/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build-resources/entitlements.mac.plist',
    entitlementsInherit: 'build-resources/entitlements.mac.plist',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ]
  },

  // Windows configuration
  win: {
    icon: 'build-resources/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ]
  },

  // Linux configuration
  linux: {
    icon: 'build-resources/icon.png',
    category: 'Education',
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      }
    ]
  },

  // NSIS installer configuration (Windows)
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'RNG Consciousness Research',
    include: 'build-resources/installer.nsh'
  },

  // DMG configuration (macOS)
  dmg: {
    title: 'RNG Consciousness Research ${version}',
    icon: 'build-resources/dmg-icon.icns',
    background: 'build-resources/dmg-background.png',
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ],
    window: {
      width: 540,
      height: 380
    }
  }
};

// Auto-updater configuration
const autoUpdaterConfig = {
  provider: 'generic',
  url: 'https://releases.rng-consciousness.org/',
  channel: 'stable'
};

// Security verification
class SecurityVerifier {
  static generateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  static async verifyBuildIntegrity(buildDir) {
    const manifest = {};
    const files = await this.getAllFiles(buildDir);

    for (const file of files) {
      const relativePath = path.relative(buildDir, file);
      manifest[relativePath] = await this.generateFileHash(file);
    }

    return manifest;
  }

  static async getAllFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}

// Build process management
class BuildManager {
  constructor() {
    this.buildInfo = {
      version: '',
      buildTime: new Date().toISOString(),
      gitCommit: '',
      platform: process.platform,
      arch: process.arch
    };
  }

  async prepareBuild() {
    console.log('🔧 Preparing build environment...');

    // Ensure build directories exist
    await fs.ensureDir('dist');
    await fs.ensureDir('build-resources');

    // Copy resources
    await this.copyBuildResources();

    // Generate build info
    await this.generateBuildInfo();

    // Validate configuration
    await this.validateBuildConfig();

    console.log('✅ Build environment prepared');
  }

  async copyBuildResources() {
    const resources = [
      { src: 'src/assets/icons', dest: 'build-resources' },
      { src: 'src/assets/installer', dest: 'build-resources' }
    ];

    for (const resource of resources) {
      if (await fs.pathExists(resource.src)) {
        await fs.copy(resource.src, resource.dest);
      }
    }
  }

  async generateBuildInfo() {
    try {
      // Get git commit hash
      const { execSync } = require('child_process');
      this.buildInfo.gitCommit = execSync('git rev-parse HEAD').toString().trim();
    } catch (error) {
      console.warn('Could not get git commit hash:', error.message);
    }

    // Get version from package.json
    const packageJson = await fs.readJson('package.json');
    this.buildInfo.version = packageJson.version;

    // Write build info
    await fs.writeJson('dist/build-info.json', this.buildInfo, { spaces: 2 });
  }

  async validateBuildConfig() {
    const requiredPaths = [
      'dist/index.html',
      'dist/main.js',
      'package.json'
    ];

    for (const path of requiredPaths) {
      if (!await fs.pathExists(path)) {
        throw new Error(`Required build file missing: ${path}`);
      }
    }
  }

  async buildForPlatform(platform, arch) {
    console.log(`🏗️ Building for ${platform}-${arch}...`);

    const platformConfig = {
      ...buildConfig,
      ...autoUpdaterConfig,

      // Platform-specific overrides
      [platform]: {
        ...buildConfig[platform],
        target: buildConfig[platform].target.filter(target =>
          !arch || target.arch.includes(arch)
        )
      }
    };

    try {
      const result = await build({
        targets: platform === 'mac' ?
          require('electron-builder').Platform.MAC.createTarget() :
          platform === 'win' ?
          require('electron-builder').Platform.WINDOWS.createTarget() :
          require('electron-builder').Platform.LINUX.createTarget(),
        config: platformConfig
      });

      console.log(`✅ Build completed for ${platform}-${arch}`);
      return result;
    } catch (error) {
      console.error(`❌ Build failed for ${platform}-${arch}:`, error);
      throw error;
    }
  }

  async generateSecurityManifest() {
    console.log('🔐 Generating security manifest...');

    const distDir = path.join(__dirname, '../dist');
    const manifest = await SecurityVerifier.verifyBuildIntegrity(distDir);

    await fs.writeJson(
      path.join(distDir, 'security-manifest.json'),
      {
        generated: new Date().toISOString(),
        version: this.buildInfo.version,
        files: manifest
      },
      { spaces: 2 }
    );

    console.log('✅ Security manifest generated');
  }

  async packageForDistribution() {
    console.log('📦 Packaging for distribution...');

    // Create distribution packages
    const packages = [];

    // Determine available builds
    const builds = await fs.readdir('dist');

    for (const buildDir of builds) {
      const buildPath = path.join('dist', buildDir);
      const stats = await fs.stat(buildPath);

      if (stats.isDirectory() && buildDir !== 'latest') {
        const packageInfo = {
          name: buildDir,
          path: buildPath,
          size: await this.getDirectorySize(buildPath),
          files: await fs.readdir(buildPath)
        };

        packages.push(packageInfo);
      }
    }

    // Generate distribution manifest
    await fs.writeJson('dist/distribution-manifest.json', {
      generated: new Date().toISOString(),
      version: this.buildInfo.version,
      packages
    }, { spaces: 2 });

    console.log('✅ Distribution packages created');
  }

  async getDirectorySize(dir) {
    let size = 0;
    const files = await SecurityVerifier.getAllFiles(dir);

    for (const file of files) {
      const stats = await fs.stat(file);
      size += stats.size;
    }

    return size;
  }
}

// Release automation
class ReleaseManager {
  constructor() {
    this.buildManager = new BuildManager();
  }

  async createRelease(version, platforms = ['mac', 'win', 'linux']) {
    console.log(`🚀 Creating release ${version}...`);

    try {
      // Prepare build environment
      await this.buildManager.prepareBuild();

      // Build for each platform
      for (const platform of platforms) {
        await this.buildManager.buildForPlatform(platform);
      }

      // Generate security artifacts
      await this.buildManager.generateSecurityManifest();

      // Package for distribution
      await this.buildManager.packageForDistribution();

      // Generate release notes
      await this.generateReleaseNotes(version);

      console.log(`✅ Release ${version} created successfully`);

    } catch (error) {
      console.error(`❌ Release creation failed:`, error);
      throw error;
    }
  }

  async generateReleaseNotes(version) {
    const releaseNotes = {
      version,
      date: new Date().toISOString().split('T')[0],
      changes: [
        'Performance improvements',
        'Bug fixes and stability enhancements',
        'Updated statistical analysis algorithms',
        'Enhanced user interface'
      ],
      systemRequirements: {
        windows: {
          os: 'Windows 10 or later',
          ram: '8GB minimum, 16GB recommended',
          storage: '1GB free space'
        },
        macOS: {
          os: 'macOS 10.15 or later',
          ram: '8GB minimum, 16GB recommended',
          storage: '1GB free space'
        },
        linux: {
          os: 'Ubuntu 18.04+ or equivalent',
          ram: '8GB minimum, 16GB recommended',
          storage: '1GB free space'
        }
      },
      installation: {
        windows: 'Run the installer and follow the setup wizard',
        macOS: 'Drag the application to your Applications folder',
        linux: 'Install the .deb/.rpm package or run the AppImage'
      }
    };

    await fs.writeJson('dist/release-notes.json', releaseNotes, { spaces: 2 });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const releaseManager = new ReleaseManager();

  switch (command) {
    case 'build':
      const platform = args[1] || process.platform;
      const arch = args[2];
      await releaseManager.buildManager.buildForPlatform(platform, arch);
      break;

    case 'release':
      const version = args[1] || 'latest';
      const platforms = args.slice(2);
      await releaseManager.createRelease(version, platforms.length ? platforms : undefined);
      break;

    case 'prepare':
      await releaseManager.buildManager.prepareBuild();
      break;

    case 'security':
      await releaseManager.buildManager.generateSecurityManifest();
      break;

    default:
      console.log('Usage:');
      console.log('  node electron-builder.js build [platform] [arch]');
      console.log('  node electron-builder.js release [version] [platforms...]');
      console.log('  node electron-builder.js prepare');
      console.log('  node electron-builder.js security');
      break;
  }
}

// Export for use as module
module.exports = {
  BuildManager,
  ReleaseManager,
  SecurityVerifier,
  buildConfig,
  autoUpdaterConfig
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}