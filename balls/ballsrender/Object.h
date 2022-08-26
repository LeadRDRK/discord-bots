#pragma once
#include <vector>
#include <cstdint>
#include <LESSR/Types/VertexAttribute.h>
#include <LESSR/Types/ImageData.h>

namespace LESSR
{

class Object
{
protected:
    std::vector<char> vertexData;
    std::vector<uint32_t> indexData;
    std::vector<ImageData> textures;
    VertexLayout vertexLayout;

};

}