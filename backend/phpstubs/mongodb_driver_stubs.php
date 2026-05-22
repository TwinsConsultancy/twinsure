<?php
// PHP stubs for MongoDB driver classes to help static analysis tools.
// These are only declared when the real extension classes are not present.
namespace MongoDB\Driver {
    if (!class_exists('MongoDB\\Driver\\Manager')) {
        class Manager {}
    }
    if (!class_exists('MongoDB\\Driver\\Query')) {
        class Query {
            public function __construct($filter = [], $options = []) {}
        }
    }
    if (!class_exists('MongoDB\\Driver\\BulkWrite')) {
        class BulkWrite {
            public function __construct() {}
            public function insert($doc) {}
            public function update($filter, $update, $options = []) {}
            public function delete($filter, $options = []) {}
        }
    }
    if (!class_exists('MongoDB\\Driver\\Command')) {
        class Command {
            public function __construct(array $cmd) {}
        }
    }
}
