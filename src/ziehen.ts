// this will contain most of the code for the project
import { ContainerSetting, GlobalOptions } from './ziehen-types';

const ziehen = (containers: Array<ContainerSetting>, globalOptions: GlobalOptions) => {
  console.log('containers', containers);
  console.log('globalOptions', globalOptions);
};

export default ziehen;
