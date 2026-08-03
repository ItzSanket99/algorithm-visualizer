package com.visualizer.engine.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Manages all workspace directories used by the execution engine.
 */
public final class WorkspaceManager {

    private static final String ROOT_DIRECTORY = "workspace";

    private static final String SOURCE_DIRECTORY = "sources";

    private static final String CLASS_DIRECTORY = "classes";

    private WorkspaceManager() {
    }

    /**
     * Creates the workspace directory structure if it does not exist.
     */
    public static void initialize() throws IOException {

        Files.createDirectories(getRootDirectory());

        Files.createDirectories(getSourceDirectory());

        Files.createDirectories(getClassDirectory());
    }

    public static Path getRootDirectory() {
        return Path.of(ROOT_DIRECTORY);
    }

    public static Path getSourceDirectory() {
        return getRootDirectory().resolve(SOURCE_DIRECTORY);
    }

    public static Path getClassDirectory() {
        return getRootDirectory().resolve(CLASS_DIRECTORY);
    }

    /**
     * Returns the full path of a source file.
     *
     * Example:
     * workspace/sources/Test.java
     */
    public static Path getSourceFile(String className) {
        return getSourceDirectory().resolve(className + ".java");
    }

}