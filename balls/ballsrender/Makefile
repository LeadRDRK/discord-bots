LUADIR= ../ballslua/lua

CXX= g++ -std=gnu++11
CXXFLAGS= -O3 -ffast-math -fopenmp -Wall -Wextra -L$(LUADIR)/src -llua -lm -ldl -s -I$(LUADIR)/src
# TODO: separate LDFLAGS and LIBS from CXXFLAGS

MKDIR= mkdir -p
RM= rm -f

all:

lua: $(MAKE) -C $(LUADIR)