#include <lua.h>
#include <lauxlib.h>
#include <lualib.h>

static int l_error(lua_State* L)
{
    const char *msg = lua_tostring(L, -1);
    lua_writestringerror("%s\n", msg);
    lua_pop(L, 1);
    lua_close(L);
    return 1;
}

void hook_routine(lua_State *L, lua_Debug *ar)
{
    if (ar->event == LUA_HOOKCOUNT)
    {
        lua_pushstring(L, "Script quota exceeded.");
        lua_error(L);
    }
}

int main(int argc, char** argv)
{
    if (argc < 3)
    {
        printf("Needs 2 arguments\n");
        return 1;
    }

    lua_State* L = luaL_newstate();
    if (L == NULL)
    {
        printf("Failed to create Lua state\n");
        return 1;
    }
    luaL_openlibs(L);

    // Run init script
    if (luaL_dostring(L, argv[2]) != LUA_OK)
    {
        fputs("Init script error, this is a bug! Please report it to the developer.\n", stderr);
        return l_error(L);
    }

    // Quota limit hook
    lua_sethook(L, hook_routine, LUA_MASKCOUNT, 500000);

    if (luaL_dostring(L, argv[1]) != LUA_OK)
        return l_error(L);

    lua_close(L);
    return 0;
}