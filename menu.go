package main

import (
	"runtime"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// TODO: Complete menubar with shortcuts
func NewMenu(app *App) *menu.Menu {
	appMenu := menu.NewMenu()
	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.AppMenu())
	}

	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("New Request", keys.CmdOrCtrl("t"), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:new-request")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Import", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:import")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Close Tab", keys.CmdOrCtrl("w"), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:close-tab")
	})
	fileMenu.AddText("Close Other Tabs", keys.Combo("w", keys.OptionOrAltKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:close-other-tabs")
	})
	fileMenu.AddText("Close All Tabs", keys.Combo("w", keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:close-all-tabs")
	})
	fileMenu.AddText("Force Close Tabs", keys.Combo("w", keys.OptionOrAltKey, keys.ShiftKey, keys.CmdOrCtrlKey), func(_ *menu.CallbackData) {
		wailsRuntime.EventsEmit(app.ctx, "menu:force-close-all-tabs")
	})

	if runtime.GOOS == "darwin" {
		appMenu.Append(menu.EditMenu())
		appMenu.Append(menu.WindowMenu())
	}

	return appMenu
}
