const INSERTPREFIX = "INSERTPREFIX";
const DELETEPREFIX = "DELETEPREFIX";

const defaultWindowsTitle = "Hyper";

const PLUGIN_PREFIX_OF_TAG_SHOW = "PLUGIN_PREFIX_OF_TAG_SHOW";
const PLUGIN_PREFIX_OF_TAG_MODAL_CLOSE = "PLUGIN_PREFIX_OF_TAG_MODAL_CLOSE";
const PLUGIN_PREFIX_OF_TAG_SET_PREFIX = "PLUGIN_PREFIX_OF_TAG_SET_PREFIX";
const PLUGIN_PREFIX_OF_TAG_DELETE_PREFIX = "PLUGIN_PREFIX_OF_TAG_DELETE_PREFIX";
const stateName = "plugin_prefix_of_tag";

const { name } = require("./package.json");
const COMMANDINSERT = `${name}:insert`;
const COMMANDDELETE = `${name}:delete`;

const newKeymaps = {
  [COMMANDINSERT]: "ctrl+shift+i",
  [COMMANDDELETE]: "ctrl+shift+d"
};

exports.decorateConfig = mainConfig => {
  config = Object.assign({}, newKeymaps, mainConfig[name] || {});
  return mainConfig;
};

const menuConfig = () => {
  return {
    label: "prefixOfTab",
    submenu: [
      {
        label: "insert",
        accelerator: config[COMMANDINSERT],
        click(item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.rpc.emit(INSERTPREFIX);
          }
        }
      },
      {
        label: "delete",
        accelerator: config[COMMANDDELETE],
        click(item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.rpc.emit(DELETEPREFIX);
          }
        }
      }
    ]
  };
};

exports.decorateMenu = menu => {
  menu.push(menuConfig());
  return menu;
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
        dispatch({
          type: PLUGIN_PREFIX_OF_TAG_DELETE_PREFIX,
          uid: activeUid
        });
      });
      next(action);
      break;
    default:
      next(action);
      break;
  }
};

exports.decorateHyper = (Component, { React }) => {
  class PrefixInputComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        value: ""
      };
    }

    closeModal() {
      this.props[PLUGIN_PREFIX_OF_TAG_MODAL_CLOSE]();
    }

    insertPrefix() {
      this.closeModal();
      this.props[INSERTPREFIX](this.state.value, this.props.activeSession);
    }

    componentDidMount() {
      this.refs.myInput.focus();
    }

    render() {
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
          onKeyDown: e => {
            if (e.keyCode === 13) {
              this.insertPrefix();
            }
            if (e.keyCode === 27) {
              this.closeModal();
            }
          }
        },
        [
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
              ref: "myInput",
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
      );
    }
  }

  return class ModalWindowComponent extends React.Component {
    ModalView() {
      const modalConfig = this.props[stateName];
      return React.createElement(
        "div",
        {
          className: "prefix-of-tag-container",
          key: 0
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
                React.createElement(
                  PrefixInputComponent,
                  Object.assign({}, this.props, { key: 1 })
                )
              ]
            )
          )
      );
    }

    render() {
      const customChildren = Array.from(this.props.customChildren || []).concat(
        this.ModalView()
      );
      return React.createElement(
        Component,
        Object.assign({}, this.props, {
          customChildren
        })
      );
    }
  };
};

exports.reduceUI = (state, action) => {
  switch (action.type) {
    case PLUGIN_PREFIX_OF_TAG_SHOW:
      state = state.setIn([stateName, "show"], action.show || false);
      break;
    case PLUGIN_PREFIX_OF_TAG_SET_PREFIX:
      state = state.setIn(
        [stateName, "prefixTitleInfo", action.uid],
        action.prefix
      );
      break;
    case PLUGIN_PREFIX_OF_TAG_DELETE_PREFIX:
      state = state.setIn([stateName, "prefixTitleInfo", action.uid], "");
      break;
  }
  return state;
};

function getDefaultPluginState() {
  return {
    show: false,
    prefixTitleInfo: {}
  };
}

exports.mapHyperState = (state, map) => {
  return Object.assign({}, map, {
    [stateName]: state["ui"][stateName] || getDefaultPluginState()
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
    if (prefix && prefix.trim()) {
      dispatch({
        type: PLUGIN_PREFIX_OF_TAG_SET_PREFIX,
        prefix: prefix.trim(),
        uid: activeUid
      });
    }
  };

  return Object.assign({}, map, {
    [PLUGIN_PREFIX_OF_TAG_MODAL_CLOSE]: modalClose,
    [INSERTPREFIX]: setPrefix
  });
};

exports.mapHeaderState = (state, map) => {
  return Object.assign({}, map, {
    [stateName]: state["ui"][stateName] || getDefaultPluginState(),
    activeSessionsMap: state.termGroups.activeSessions
  });
};

exports.getTabsProps = (parentProps, props) => {
  let tabs = props.tabs;
  // if there's only one tab we use its title as the window title
  if (props.tabs.length === 1) {
    const prefix = (parentProps[stateName]["prefixTitleInfo"] || {})[
      parentProps.activeSessionsMap[props.tabs[0].uid]
    ];
    if (prefix) {
      // copy the tabs to avoid change the origin
      tabs = [
        Object.assign({}, tabs[0], {
          title: `${prefix}: ${props.tabs[0].title || defaultWindowsTitle}`
        })
      ];
    }
  }
  return Object.assign(
    {},
    props,
    { tabs },
    {
      [stateName]: parentProps[stateName],
      activeSessionsMap: parentProps.activeSessionsMap
    }
  );
};

exports.getTabProps = ({ uid }, parentProps, props) => {
  const prefix = (parentProps[stateName]["prefixTitleInfo"] || {})[
    parentProps.activeSessionsMap[uid]
  ];
  if (prefix) {
    return Object.assign({}, props, {
      text: `${prefix}: ${props.text}`
    });
  } else {
    return props;
  }
};
