
            SELECT 
                ISNULL(cm.CategoryName, 'Unknown')    AS [Category Name],
                ISNULL(dg.DishGroupName, 'Unknown')   AS [DishGroup Name],
                ISNULL(dm.Name, rod.DishName)         AS [DishName],
                CONVERT(VARCHAR(10), rod.OrderDateTime, 103) AS [TranDate],
                0                                     AS [Opening Stock],
                SUM(CASE WHEN rod.PFlag = 'P' THEN ISNULL(rod.Quantity, 0) ELSE 0 END) AS [PQty],
                SUM(CASE WHEN rod.PFlag = 'PR' THEN ISNULL(rod.Quantity, 0) ELSE 0 END) AS [PRQty],
                SUM(CASE WHEN rod.PFlag IN ('R', 'D') OR rod.PFlag IS NULL OR rod.PFlag = '' THEN ISNULL(rod.Quantity, 0) ELSE 0 END) AS [SQty],
                SUM(0)                                AS [SRQty],
                ISNULL(SUM(rod.Quantity) * -1, 0)      AS [Closing Stock]
            FROM RestaurantOrderDetail rod
            LEFT JOIN DishMaster dm ON rod.DishId = dm.DishId
            LEFT JOIN DishGroupMaster dg ON dm.DishGroupId = dg.DishGroupId
            LEFT JOIN CategoryMaster cm ON dg.CategoryId = cm.CategoryId
            WHERE rod.OrderDateTime BETWEEN '2024-11-28T00:00:00' AND '2026-04-28T23:59:59'
            AND REPLACE(ISNULL(cm.CategoryName,''), ' ', '') LIKE '%' + REPLACE(@category, ' ', '') + '%'
            AND REPLACE(ISNULL(dg.DishGroupName,''), ' ', '') LIKE '%' + REPLACE(@dishGroup, ' ', '') + '%'
            AND REPLACE(ISNULL(dm.Name,''), ' ', '') LIKE '%' + REPLACE(@dishName, ' ', '') + '%'
            
            GROUP BY 
                cm.CategoryName,
                dg.DishGroupName,
                dm.Name,
                rod.DishName,
                CONVERT(VARCHAR(10), rod.OrderDateTime, 103)
            ORDER BY 
                cm.CategoryName,
                dg.DishGroupName,
                dm.Name,
                CONVERT(VARCHAR(10), rod.OrderDateTime, 103)
        