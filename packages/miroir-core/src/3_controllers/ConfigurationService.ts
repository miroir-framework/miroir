
export interface PackageConfiguration {
  packageName: string;
  packageVersion: string;
}
/**
 * Allows Miroir packages to inject (and access?) configuration information.
 */
export class ConfigurationService {
  static packages:PackageConfiguration[] = [];

  constructor() {
    
  }

  /**
   * registerPackageConfiguration
   */
  public static registerPackageConfiguration(packageConfiguration: PackageConfiguration) {
    console.log("ConfigurationService registerPackageConfiguration",packageConfiguration);
    this.packages.push(packageConfiguration);
  }

}