<?php

namespace MongoDB;

class Client
{
    public function __construct(string $uri = '', array $uriOptions = [], array $driverOptions = []) {}

    public function selectDatabase(string $databaseName): Database
    {
        return new Database();
    }
}

class Database
{
    public function selectCollection(string $collectionName): Collection
    {
        return new Collection();
    }

    public function createCollection(string $collectionName, array $options = []): void {}

    public function listCollectionNames(array $options = []): \Iterator
    {
        return new \ArrayIterator();
    }
}

class Collection
{
    public function insertOne(array $document, array $options = []) {}

    public function findOne(array $filter = [], array $options = [])
    {
        return null;
    }

    public function find(array $filter = [], array $options = []): \Iterator
    {
        return new \ArrayIterator();
    }

    public function updateOne(array $filter, array $update, array $options = []) {}
}