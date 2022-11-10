import {normalizePath, Plugin} from 'vite';
import {CLIENT_PUBLIC_ABSOLUTE_PATH} from './constants';
import {debug as Debug} from 'debug';
import {createContext} from "./context";

const debug = Debug('vite:inject-vite-plugin-theme-client');

export function injectClientPlugin(): Plugin {
  const context = createContext();

  return {
    name: 'vite:inject-vite-plugin-theme-client',
    enforce: 'pre',
    // configResolved(resolvedConfig) {
    //   config = resolvedConfig;
    //   isServer = resolvedConfig.command === 'serve';
    //   needSourcemap = !!resolvedConfig.build.sourcemap;
    // },
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
      const getMap = () => (context.needSourceMap ? this.getCombinedSourcemap() : null);

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
          base,
          build: {assetsDir},
        } = context.viteOptions;

        const getOutputFile = (name?: string) => {
          return JSON.stringify(`${base}${assetsDir}/${name}`);
        };

        code = code
          .replace('__COLOR_PLUGIN_OUTPUT_FILE_NAME__', getOutputFile(context.colorThemeFileName))
          .replace('__COLOR_PLUGIN_OPTIONS__', JSON.stringify(context.colorThemeOptions));

        code = code.replace(
          '__ANTD_DARK_PLUGIN_OUTPUT_FILE_NAME__',
          getOutputFile(context.antdThemeFileName)
        ).replace('__ANTD_DARK_PLUGIN_EXTRACT_CSS__',
          JSON.stringify(context.antdThemeOptions.extractCss)
        ).replace(
          '__ANTD_DARK_PLUGIN_LOAD_LINK__',
          JSON.stringify(context.antdThemeOptions?.loadMethod === 'link')
        );

        return {
          code: code.replace('__PROD__', JSON.stringify(!context.devEnvironment)),
          map: getMap(),
        };
      }
    },
  };
}
