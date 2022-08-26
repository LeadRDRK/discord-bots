#include <lua.h>
#include <lauxlib.h>
#include <lualib.h>
#include <string.h>
#include <stdlib.h>

#define RETURN_STR "return "
#define RETURN_LEN 7

static const char SEPARATOR[25] =
{
    -16,  -97, -104,  -75,
    -16,  -97, -104,  -83,
    -16,  -97, -120,  -75,
    -16,  -97, -104,  -96,
    -16,  -97, -114,  -86,
    -16,  -97,  -92, -107,
    0
};

static int l_error(lua_State* L)
{
    const char *msg = lua_tostring(L, -1);
    lua_writestringerror("%s\n", msg);
    lua_pop(L, 1);
    lua_close(L);
    return 1;
}

static int l_try_raw_exec(lua_State* L, char* str)
{
    // Pop error message off the stack
    lua_pop(L, 1);

    // Try executing without "return"
    if (luaL_dostring(L, str) != LUA_OK)
        return l_error(L);
    
    return 0;
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

    // Add "return ..." to line
    size_t line_size = strlen(argv[1]) + 1;
    char* return_line = malloc(sizeof(char) * (line_size + RETURN_LEN)); // "return " + "\0"
    memcpy(return_line, RETURN_STR, sizeof(char) * RETURN_LEN);
    memcpy(return_line + RETURN_LEN, argv[1], sizeof(char) * line_size);

    int ret = luaL_dostring(L, return_line);
    free(return_line);
    if (ret != LUA_OK)
    {
        if (l_try_raw_exec(L, argv[1]))
            return 1;
    }

    // Print values
    int stack_size = lua_gettop(L) + 1;
    for (int i = 1; i < stack_size; ++i)
    {
        if (i > 1)
            fputs(SEPARATOR, stdout);
        
        int type = lua_type(L, i);
        switch (type)
        {
        case LUA_TNUMBER:
            printf("%.17g", lua_tonumber(L, i));
            break;

        case LUA_TSTRING:
            printf("%s", lua_tostring(L, i));
            break;
        }
    }

    lua_close(L);
    return 0;
}