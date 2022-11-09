import {normalizePath, Plugin, ResolvedConfig} from 'vite';
import {ViteThemeOptions} from '.';
import {CLIENT_PUBLIC_ABSOLUTE_PATH} from './constants';
import { debug as Debug } from 'debug';

type PluginType = 'colorPlugin' | 'antdDarkPlugin';

const debug = Debug('vite:inject-vite-plugin-theme-client');

export function injectClientPlugin(
  type: PluginType,
  {
    colorPluginOptions,
    colorPluginCssOutputName = '',
    antdDarkCssOutputName = '',
    antdDarkExtractCss = false,
    antdDarkLoadLink = false,
  }: {
    colorPluginOptions?: ViteThemeOptions;
    antdDarkCssOutputName?: string;
    colorPluginCssOutputName?: string;
    antdDarkExtractCss?: boolean;
    antdDarkLoadLink?: boolean;
  }
): Plugin {
  let config: ResolvedConfig
  let isServer: boolean
  let needSourcemap: boolean

  return {
    name: 'vite:inject-vite-plugin-theme-client',
    enforce: 'pre',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      isServer = resolvedConfig.command === 'serve';
      needSourcemap = !!resolvedConfig.build.sourcemap;
    },
    // resolveId(id) {
    //   if (id.includes('vite-plugin-theme')) {
    //     console.log('resolveId', id);
    //   }
      // if (id === virtualModuleId) {
      //
      //   console.log('virtual:theme-config', virtualModuleId, resolvedVirtualModuleId)
      //   return resolvedVirtualModuleId
      // }
    // },

    // load(id) {
    //   if (id === resolvedVirtualModuleId) {
    //     console.log('load ok')
    //     const getOutputFile = (name?: string) => {
    //       return JSON.stringify(`${config.base}${config.build.assetsDir}/${name}`)
    //     }
    //
    //     return `
    //     export const colorPluginOptions = ${JSON.stringify(colorPluginOptions)};
    //     export const colorPluginOutputFileName = ${getOutputFile(colorPluginCssOutputName)};
    //     export const antdDarkPluginOutputFileName = ${getOutputFile(antdDarkCssOutputName)};
    //     export const antdDarkPluginExtractCss = ${antdDarkExtractCss};
    //     export const antdDarkPluginLoadLink = ${antdDarkLoadLink};
    //     export const isProd = ${!isServer};
    //     `
    //   }
    // },

    // transformIndexHtml: {
    //   enforce: 'pre',
    //   async transform(html) {
    //     if (html.includes(CLIENT_PUBLIC_ABSOLUTE_PATH)) {
    //       return html;
    //     }
    //     return {
    //       html,
    //       tags: [
    //         {
    //           tag: 'script',
    //           attrs: {
    //             type: 'module',
    //             src: CLIENT_PUBLIC_ABSOLUTE_PATH,
    //           },
    //           injectTo: 'head-prepend',
    //         },
    //       ],
    //     };
    //   },
    // },

    async transform(code, id) {
      const nid = normalizePath(id);
      const path = normalizePath('vite-plugin-theme/es/client.js');
      const getMap = () => (needSourcemap ? this.getCombinedSourcemap() : null);

      if (
        nid === CLIENT_PUBLIC_ABSOLUTE_PATH ||
        nid.endsWith(path) ||
        nid.includes('vite-plugin-theme/es') ||
        nid.includes('vite-plugin-theme_es') ||
        // support .vite cache
        nid.includes(path.replace(/\//gi, '_'))
      ) {
        debug('transform client file:', id, code);

        const {
          build: {assetsDir},
        } = config;

        const getOutputFile = (name?: string) => {
          return JSON.stringify(`${config.base}${assetsDir}/${name}`);
        };

        code = code
          .replace('__COLOR_PLUGIN_OUTPUT_FILE_NAME__', getOutputFile(colorPluginCssOutputName))
          .replace('__COLOR_PLUGIN_OPTIONS__', JSON.stringify(colorPluginOptions));

        code = code.replace(
          '__ANTD_DARK_PLUGIN_OUTPUT_FILE_NAME__',
          getOutputFile(antdDarkCssOutputName)
        );
        code = code.replace(
          '__ANTD_DARK_PLUGIN_EXTRACT_CSS__',
          JSON.stringify(antdDarkExtractCss)
        );
        code = code.replace(
          '__ANTD_DARK_PLUGIN_LOAD_LINK__',
          JSON.stringify(antdDarkExtractCss)
        );

        return {
          code: code.replace('__PROD__', JSON.stringify(!isServer)),
          map: getMap(),
        };
      }
    },
  };
}
