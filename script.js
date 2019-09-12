if (!window.onload) {
	window.onload = function load() {
    	changeTheme(localStorage.getItem("theme"));
	}
}

function changeTheme(theme) {
    switch (theme) {
        case "bright":
            changeThemeColors(
                "rgb(255,255,255)",
                "rgb(200,200,200)",
                "rgb(0,0,0)",
                "rgb(50,50,50)",
                "rgb(100,100,100)"
            );
        break;
        case "dark":
            changeThemeColors(
                "rgb(10,10,10)",
                "rgb(50,50,50)",
                "rgb(255, 255, 255)",
                "rgb(200, 200, 200)",
                "rgb(150,150,150)"
            );
        break;
        case "rgb":
            changeThemeColors(
                "rgb(10, 10, 10)",
                "rgb(50,50,50)",
                "rgb(255, 0, 0)",
                "rgb(0, 255, 0)",
                "rgb(0, 0, 255)"
            );
        break;
        case "c64":
            changeThemeColors(
                "#7c71da",
                "#3e32a2",
                "#7c71da",
                "#7c71da",
                "#7c71da",
                "#3e32a2"
            );
        break;
        default:
            return;
    }
    localStorage.setItem("theme", theme);
}

function changeThemeColors(background, highlight, primary, secondary, tertiary, main_color) {
    document.all[0].style.setProperty("--background", background);
    document.all[0].style.setProperty("--highlight", highlight);
    document.all[0].style.setProperty("--primary", primary);
    document.all[0].style.setProperty("--secondary", secondary);
    document.all[0].style.setProperty("--tertiary", tertiary);

    if (main_color) {
        changeMainColor(main_color);
    } else {
        changeMainColor(background);
    }
}

function changeMainColor(main_color) {
    document.all[0].style.setProperty("--main-color", main_color);
}
