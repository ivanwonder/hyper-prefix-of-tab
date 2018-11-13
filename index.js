const { BrowserWindow, ipcMain } = require("electron");

let app;
const INSERTPREFIX = "INSERTPREFIX";
const DELETEPREFIX = "DELETEPREFIX";

const SESSION_SET_XTERM_TITLE = "SESSION_SET_XTERM_TITLE";
const prefixTitleInfo = {};
const cacheXtermTitle = {};
const defaultTitle = "Shell";

const PLUGIN_PREFIX_OF_TAG_SHOW = "PLUGIN_PREFIX_OF_TAG_SHOW";
const PLUGIN_PREFIX_OF_TAG_MODAL_CLOSE = "PLUGIN_PREFIX_OF_TAG_MODAL_CLOSE";
const stateName = "plugin_prefix_of_tag";

function openWindows() {
  const parent = app.getLastFocusedWindow();
  parent.rpc.emit(INSERTPREFIX);
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
      window.rpc.on(INSERTPREFIX, () => {
        dispatch({
          type: PLUGIN_PREFIX_OF_TAG_SHOW,
          show: true
        });
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

exports.decorateHyper = (Component, { React }) => {
  return class ModalWindowComponent extends React.Component {
    constructor() {
      super();
      this.state = {
        value: ""
      };
    }

    ModalView() {
      const modalConfig = this.props[stateName];
      const buttonStyle = {
        display: "inline-block",
        marginBottom: 0,
        fontWeight: 500,
        textAlign: "center",
        touchAction: "manipulation",
        cursor: "pointer",
        backgroundImage: "none",
        border: "1px solid transparent",
        whiteSpace: "nowrap",
        lineHeight: 1.15,
        padding: "0 15px",
        fontSize: "12px",
        borderRadius: "4px",
        height: "32px",
        background: "#fc0",
        color: "#000",
        borderColor: "#fc0"
      };
      return React.createElement(
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
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  borderRadius: "4px",
                  padding: "20px",
                  backgroundColor: "#FFF"
                }
              },
              [
                React.createElement(
                  "style",
                  { key: 0 },
                  `
                  .prefix-of-tag-container * {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
                  }
                  .prefix-of-tag-container button:focus {
                    outline: none;
                  }
                `
                ),
                React.createElement("div", { key: 1 }, [
                  React.createElement(
                    "span",
                    {
                      key: 0,
                      style: {
                        display: "inline-block",
                        color: "#000",
                        lineHeight: "32px",
                        marginRight: "20px"
                      }
                    },
                    "prefix:"
                  ),
                  React.createElement("input", {
                    key: 1,
                    style: {
                      height: "32px",
                      width: "160px",
                      borderRadius: "4px",
                      padding: "4px 7px",
                      outline: "none",
                      border: "1px solid #d9d9d9",
                      fontSize: "12px",
                      lineHeight: 1.5,
                      color: "rgba(0,0,0,.65)",
                      backgroundColor: "#fff"
                    },
                    value: this.state.value,
                    onChange: event => {
                      this.setState({
                        value: event.target.value
                      });
                    }
                  })
                ]),
                React.createElement(
                  "div",
                  {
                    key: 2,
                    style: {
                      textAlign: "right",
                      marginTop: "40px"
                    }
                  },
                  [
                    React.createElement(
                      "button",
                      {
                        key: 2,
                        onClick: this.insertPrefix.bind(this),
                        style: Object.assign({}, buttonStyle, {
                          marginRight: "20px"
                        })
                      },
                      "save"
                    ),
                    React.createElement(
                      "button",
                      {
                        key: 3,
                        onClick: this.closeModal.bind(this),
                        style: buttonStyle
                      },
                      "close"
                    )
                  ]
                )
              ]
            )
          )
      );
    }

    closeModal() {
      this.props[PLUGIN_PREFIX_OF_TAG_MODAL_CLOSE]();
    }

    insertPrefix() {
      this.closeModal();
      this.props[INSERTPREFIX](this.state.value, this.props.activeSession);
    }

    render() {
      return React.createElement(
        Component,
        Object.assign({}, this.props, {
          customChildren: this.ModalView()
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
    [stateName]: state["ui"][stateName] || {
      show: false,
      tip: ""
    }
  });
};

exports.mapHyperDispatch = (dispatch, map) => {
  const modalClose = () => {
    dispatch({
      type: PLUGIN_PREFIX_OF_TAG_SHOW,
      show: false
    });
  };

  const setPrefix = (prefix, activeUid) => {
    if (prefix) {
      prefixTitleInfo[activeUid] = prefix;
      dispatch({
        type: SESSION_SET_XTERM_TITLE,
        title: cacheXtermTitle[activeUid] || defaultTitle,
        uid: activeUid
      });
    }
  };

  return Object.assign({}, map, {
    [PLUGIN_PREFIX_OF_TAG_MODAL_CLOSE]: modalClose,
    [INSERTPREFIX]: setPrefix
  });
};
