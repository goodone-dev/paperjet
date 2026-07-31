package main

import (
	"runtime"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
)

// TODO: Complete menubar with shortcuts
func NewMenu() *menu.Menu {
	appMenu := menu.NewMenu()
	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.AppMenu())
	}

	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("New Request", keys.CmdOrCtrl("t"), func(_ *menu.CallbackData) {
		// do something
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Import", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		// do something
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Close Tab", keys.CmdOrCtrl("w"), func(_ *menu.CallbackData) {
		// do something
	})
	fileMenu.AddText("Close Other Tabs", keys.CmdOrCtrl(""), func(_ *menu.CallbackData) {
		// do something
	})
	fileMenu.AddText("Close All Tabs", keys.CmdOrCtrl(""), func(_ *menu.CallbackData) {
		// do something
	})
	fileMenu.AddText("Force Close Tabs", keys.CmdOrCtrl(""), func(_ *menu.CallbackData) {
		// do something
	})

	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.EditMenu())
		appMenu.Append(menu.WindowMenu())
	}

	return appMenu
}
