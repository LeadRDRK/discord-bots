add_executable(ballslua ballslua.c)
target_link_libraries(ballslua PRIVATE lua)

add_executable(ballslua_eval ballslua_eval.c)
target_link_libraries(ballslua_eval PRIVATE lua)