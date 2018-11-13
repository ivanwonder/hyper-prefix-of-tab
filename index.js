const { BrowserWindow, ipcMain } = require("electron");

let app;
const INSERTPREFIX = "INSERTPREFIX";
const DELETEPREFIX = "DELETEPREFIX";

const SESSION_SET_XTERM_TITLE = "SESSION_SET_XTERM_TITLE";
const prefixTitleInfo = {};
const cacheXtermTitle = {};
const defaultTitle = "Shell";

function openWindows() {
  const parent = app.getLastFocusedWindow();
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    parent,
    modal: true,
    minimizable: false,
    maximizable: false
  });
  win.setMenu(null);
  win.on("closed", () => {
    win = null;
    parent.setAlwaysOnTop(false);
  });

  win.loadURL(`file://${__dirname}/index.html`);
  parent.setAlwaysOnTop(true);

  ipcMain.removeAllListeners(["prefixOfTab"]);
  ipcMain.on("prefixOfTab", (event, arg) => {
    win.close();
    parent.rpc.emit(INSERTPREFIX, arg);
  });
}

function clearPrefix() {
  const parent = app.getLastFocusedWindow();
  parent.rpc.emit(DELETEPREFIX);
}

const menuConfig = {
  label: "prefixOfTab",
  submenu: [
    {
      label: "insert",
      click() {
        openWindows();
      }
    },
    {
      label: "delete",
      click() {
        clearPrefix();
      }
    }
  ]
};

exports.decorateMenu = menu => {
  menu.push(menuConfig);
  return menu;
};

exports.onApp = _app => {
  app = _app;
};

exports.middleware = ({ dispatch, getState }) => next => action => {
  switch (action.type) {
    case "INIT":
      window.rpc.on(INSERTPREFIX, prefix => {
        if (prefix) {
          const activeUid = getState().ui.activeUid;
          prefixTitleInfo[activeUid] = prefix;
          dispatch({
            type: SESSION_SET_XTERM_TITLE,
            title: cacheXtermTitle[activeUid] || defaultTitle,
            uid: activeUid
          });
        }
      });

      window.rpc.on(DELETEPREFIX, () => {
        const activeUid = getState().ui.activeUid;
        prefixTitleInfo[activeUid] = "";
        if (cacheXtermTitle[activeUid]) {
          dispatch({
            type: SESSION_SET_XTERM_TITLE,
            title: cacheXtermTitle[activeUid],
            uid: activeUid
          });
        }
      });
      next(action);
      break;
    case SESSION_SET_XTERM_TITLE:
      cacheXtermTitle[action.uid] = action.title || defaultTitle;
      if (prefixTitleInfo[action.uid]) {
        action.title = `${prefixTitleInfo[action.uid]}: ${action.title}`;
      }
      next(action);
      break;
    default:
      next(action);
      break;
  }
};

const PLUGIN_PREFIX_OF_TAG_SHOW = "PLUGIN_PREFIX_OF_TAG_SHOW";
const PLUGIN_PREFIX_OF_TAG_HIDE = "PLUGIN_PREFIX_OF_TAG_HIDE";
const stateName = "plugin_prefix_of_tag";

exports.decorateHyper = (Component, { React }) => {
  const ModalView = modalConfig =>
    React.createElement(
      "div",
      {
        className: "prefix-of-tag-container"
      },
      modalConfig.show &&
        React.createElement(
          "div",
          {
            style: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }
          },
          React.createElement(
            "div",
            {
              style: {
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)"
              }
            },
            React.createElement("span", null, modalConfig.tip)
          )
        )
    );

  return class ModalWindowComponent extends React.Component {
    render() {
      return React.createElement(
        Component,
        Object.assign({}, this.props, {
          customChildren: ModalView(this.props[stateName])
        })
      );
    }
  };
};

exports.reduceUI = (state, action) => {
  switch (action.type) {
    case PLUGIN_PREFIX_OF_TAG_SHOW:
      state = state.setIn([stateName, "show"], action.show || false);
      state = state.setIn([stateName, "tip"], action.tip || "");
      break;
  }
  return state;
};

exports.mapHyperState = (state, map) => {
  return Object.assign({}, map, {
    [stateName]: state[stateName] || {
      show: false,
      tip: ""
    }
  });
};
